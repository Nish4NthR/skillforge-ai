import { NextRequest } from "next/server";
import { assessmentAgentOutputSchema } from "@/lib/ai/schemas";
import { runSingleAgent } from "@/lib/agents/orchestrator";
import { apiError, requireUser } from "@/lib/services";
import { createAdminClient } from "@/lib/supabase/admin";
import { assessmentGenerateSchema } from "@/lib/validation/learning.schema";

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const input = assessmentGenerateSchema.parse(await request.json());
    const admin = createAdminClient();
    if (input.roadmapStepId) {
      const { data: step, error } = await supabase.from("roadmap_steps").select("id").eq("id", input.roadmapStepId).maybeSingle();
      if (error) throw error;
      if (!step) return Response.json({ error: "Roadmap step not found" }, { status: 404 });
    }
    const result = await runSingleAgent(supabase, user.id, "assessment", { skillId: input.skillId });
    const output = assessmentAgentOutputSchema.parse(result.output);
    const questions = output.questions.slice(0, input.questionCount);
    if (questions.some((question) => question.skillId !== input.skillId)) throw new Error("Assessment generated questions for an unexpected skill.");
    const { data: assessment, error: assessmentError } = await supabase.from("assessments").insert({ user_id: user.id, skill_id: input.skillId, roadmap_step_id: input.roadmapStepId ?? null, status: "ready", difficulty: input.difficulty, question_count: questions.length }).select("id,skill_id,roadmap_step_id,status,difficulty,question_count,created_at").single();
    if (assessmentError) throw assessmentError;
    const assessmentId = String((assessment as { id: string }).id);
    const questionRows = questions.map((question) => ({ assessment_id: assessmentId, skill_id: question.skillId, question_text: question.questionText, difficulty: question.difficulty, options: question.options, concept: question.concept }));
    const { data: insertedQuestions, error: questionError } = await supabase.from("questions").insert(questionRows).select("id,skill_id");
    if (questionError) throw questionError;
    const answerRows = (insertedQuestions as Array<{ id: string; skill_id: string }>).map((row, index) => ({ question_id: row.id, correct_answer: questions[index].correctAnswer, explanation: questions[index].explanation }));
    const { error: answerKeyError } = await admin.from("assessment_answer_keys").insert(answerRows);
    if (answerKeyError) throw answerKeyError;
    const publicQuestions = questions.map((question) => ({ skillId: question.skillId, questionText: question.questionText, difficulty: question.difficulty, options: question.options, concept: question.concept }));
    return Response.json({ assessment, questions: publicQuestions }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
