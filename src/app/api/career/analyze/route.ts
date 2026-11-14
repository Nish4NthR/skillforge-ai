import { NextRequest } from "next/server";
import { apiError, requireUser } from "@/lib/services";
import { careerAnalyzeSchema } from "@/lib/validation/career.schema";
import { compareCareers } from "@/lib/career/career-matcher";
import type { Role, RoleSkill } from "@/types/career";
import type { LearnerSkill, Skill } from "@/types/skill";

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const { roleId } = careerAnalyzeSchema.parse(await request.json());
    const [{ data: roles, error: rolesError }, { data: roleSkills, error: roleSkillsError }, { data: learnerSkills, error: learnerError }, { data: skills, error: skillsError }] = await Promise.all([
      supabase.from("roles").select("*").order("name"),
      supabase.from("role_skills").select("*, skills(*)"),
      supabase.from("learner_skills").select("*").eq("user_id", user.id),
      supabase.from("skills").select("*")
    ]);
    if (rolesError || roleSkillsError || learnerError || skillsError) throw rolesError ?? roleSkillsError ?? learnerError ?? skillsError;
    const skillMap = new Map((skills ?? []).map((skill) => [skill.id, skill as unknown as Skill]));
    const grouped = (roles ?? []).filter((role) => !roleId || role.id === roleId).map((role) => ({
      role: role as unknown as Role,
      skills: (roleSkills ?? []).filter((item) => item.role_id === role.id).map((item) => ({ roleId: item.role_id, skillId: item.skill_id, skill: skillMap.get(item.skill_id), requiredLevel: Number(item.required_level), importance: Number(item.importance) })) as RoleSkill[],
    }));
    const normalizedLearnerSkills = (learnerSkills ?? []).map((item) => ({ userId: item.user_id, skillId: item.skill_id, pKnown: Number(item.p_known), claimedLevel: item.claimed_level, evidenceScore: Number(item.evidence_score), confidence: Number(item.confidence), status: item.status })) as LearnerSkill[];
    return Response.json({ analyses: compareCareers(grouped, normalizedLearnerSkills) });
  } catch (error) { return apiError(error); }
}
