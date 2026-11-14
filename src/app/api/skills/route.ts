import { NextRequest } from "next/server";
import { initializeMastery, isMastered } from "@/lib/mastery/bkt";
import { requireUser, apiError } from "@/lib/services";
import { skillsPayloadSchema } from "@/lib/validation/skill.schema";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const [{ data: skills, error: skillsError }, { data: learnerSkills, error: learnerError }, { data: prerequisites, error: prerequisitesError }] = await Promise.all([
      supabase.from("skills").select("id,name,category,description").order("category").order("name"),
      supabase.from("learner_skills").select("*").eq("user_id", user.id),
      supabase.from("skill_prerequisites").select("skill_id,prerequisite_id"),
    ]);
    if (skillsError) throw skillsError; if (learnerError) throw learnerError; if (prerequisitesError) throw prerequisitesError;
    return Response.json({ skills: skills ?? [], learnerSkills: learnerSkills ?? [], prerequisites: prerequisites ?? [] });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const payload = skillsPayloadSchema.parse(await request.json());
    const rows = payload.skills.map((skill) => {
      const mastery = initializeMastery(skill.evidenceScore, skill.claimedLevel);
      return { user_id: user.id, skill_id: skill.skillId, claimed_level: skill.claimedLevel, evidence_score: skill.evidenceScore, p_known: mastery.pKnown, confidence: mastery.confidence, status: isMastered(mastery.pKnown) ? "mastered" : "developing" };
    });
    const { data, error } = await supabase.from("learner_skills").upsert(rows, { onConflict: "user_id,skill_id" }).select();
    if (error) throw error;
    return Response.json({ learnerSkills: data ?? [] });
  } catch (error) { return apiError(error); }
}
