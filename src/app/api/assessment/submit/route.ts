import { NextRequest } from "next/server";
import { updateLearnerSkill } from "@/lib/mastery/mastery-service";
import { initializeMastery } from "@/lib/mastery/bkt";
import { runAdaptiveRecovery } from "@/lib/agents/orchestrator";
import { apiError, requireUser } from "@/lib/services";
import { createAdminClient } from "@/lib/supabase/admin";
import { assessmentSubmitSchema } from "@/lib/validation/learning.schema";
import { gradeAssessment } from "@/lib/learning/assessment";
import { shouldAdaptAssessment } from "@/lib/learning/adaptation";

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const input = assessmentSubmitSchema.parse(await request.json());
    const { data: assessment, error: assessmentError } = await supabase.from("assessments").select("*").eq("id", input.assessmentId).eq("user_id", user.id).maybeSingle();
    if (assessmentError) throw assessmentError;
    if (!assessment) return Response.json({ error: "Assessment not found" }, { status: 404 });
    if ((assessment as { status: string }).status === "submitted") return Response.json({ error: "Assessment has already been submitted" }, { status: 409 });
    const { data: questions, error: questionsError } = await supabase.from("questions").select("*").eq("assessment_id", input.assessmentId);
    if (questionsError) throw questionsError;
    const questionIdsForKeys = ((questions ?? []) as Array<Record<string, unknown>>).map((question) => String(question.id));
    const { data: answerKeys, error: answerKeyError } = await createAdminClient().from("assessment_answer_keys").select("question_id,correct_answer,explanation").in("question_id", questionIdsForKeys);
    if (answerKeyError) throw answerKeyError;
    const questionRows = (questions ?? []) as Array<Record<string, unknown>>;
    const answerKeyByQuestion = new Map(((answerKeys ?? []) as Array<Record<string, unknown>>).map((key) => [String(key.question_id), key]));
    if (answerKeyByQuestion.size !== questionRows.length) throw new Error("Assessment answer keys are unavailable on the server.");
    const grading = gradeAssessment(questionRows.map((question) => { const key = answerKeyByQuestion.get(String(question.id))!; return { id: String(question.id), correctAnswer: String(key.correct_answer), explanation: String(key.explanation), concept: String(question.concept) }; }), input.answers);
    const { graded, correctCount, totalCount, score } = grading;
    const { data: attempt, error: attemptError } = await supabase.from("attempts").insert({ assessment_id: input.assessmentId, user_id: user.id, correct_count: correctCount, total_count: totalCount, score }).select("id").single();
    if (attemptError) {
      if (attemptError.code === "23505") return Response.json({ error: "Assessment has already been submitted" }, { status: 409 });
      throw attemptError;
    }
    const attemptId = String((attempt as { id: string }).id);
    const { error: answersError } = await supabase.from("attempt_answers").insert(graded.map((item) => ({ attempt_id: attemptId, question_id: item.questionId, answer: item.answer, is_correct: item.correct })));
    if (answersError) throw answersError;
    const { data: learnerSkill, error: learnerSkillError } = await supabase.from("learner_skills").select("*").eq("user_id", user.id).eq("skill_id", String((assessment as { skill_id: string }).skill_id)).maybeSingle();
    if (learnerSkillError) throw learnerSkillError;
    let mastery = learnerSkill ? { pKnown: Number((learnerSkill as { p_known: number }).p_known), confidence: Number((learnerSkill as { confidence: number }).confidence) } : initializeMastery(0, 0);
    const history = [];
    for (const item of graded) {
      const update = updateLearnerSkill(mastery.pKnown, item.correct);
      history.push({ user_id: user.id, skill_id: String((assessment as { skill_id: string }).skill_id), attempt_id: attemptId, source: "assessment", observation: update.observation, prior_p_known: update.prior, posterior_p_known: update.posterior, updated_p_known: update.updated });
      mastery = { pKnown: update.updated, confidence: Math.max(mastery.confidence, score) };
    }
    const current = learnerSkill as Record<string, unknown> | null;
    const { error: masteryError } = await supabase.from("learner_skills").upsert({ user_id: user.id, skill_id: String((assessment as { skill_id: string }).skill_id), claimed_level: Number(current?.claimed_level ?? 0), evidence_score: Math.max(Number(current?.evidence_score ?? 0), score), p_known: mastery.pKnown, confidence: mastery.confidence, status: mastery.pKnown >= 0.8 ? "mastered" : "developing" }, { onConflict: "user_id,skill_id" });
    if (masteryError) throw masteryError;
    const { error: historyError } = await supabase.from("mastery_history").insert(history);
    if (historyError) throw historyError;
    await supabase.from("assessments").update({ status: "submitted", score, submitted_at: new Date().toISOString() }).eq("id", input.assessmentId).eq("user_id", user.id);
    const roadmapStepId = (assessment as { roadmap_step_id?: string | null }).roadmap_step_id;
    if (roadmapStepId) await supabase.from("roadmap_steps").update({ status: shouldAdaptAssessment(score) ? "needs_review" : "completed" }).eq("id", roadmapStepId);
    let adaptation: { runId?: string; roadmapId?: string | null; explanation?: string; error?: string } | null = null;
    if (shouldAdaptAssessment(score)) {
      const { data: goal } = await supabase.from("goals").select("role_id").eq("user_id", user.id).eq("active", true).maybeSingle();
      if (goal) {
        try {
          const result = await runAdaptiveRecovery(supabase, user.id, {
            skillId: String((assessment as { skill_id: string }).skill_id),
            score,
            weakConcepts: graded.filter((item) => !item.correct).map((item) => item.concept),
            roleId: String((goal as { role_id: string }).role_id),
          });
          adaptation = { runId: result.runId, roadmapId: result.roadmapId, explanation: result.mentor?.answer };
        }
        catch (error) { adaptation = { error: error instanceof Error ? error.message : "Adaptation failed" }; }
      }
    }
    return Response.json({ attempt: { id: attemptId, score, correctCount, totalCount }, feedback: graded, mastery: { pKnown: mastery.pKnown, confidence: mastery.confidence }, adaptation });
  } catch (error) {
    return apiError(error);
  }
}
