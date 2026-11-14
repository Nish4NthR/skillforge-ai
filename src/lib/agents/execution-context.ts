import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentContext, ResourceRecord } from "@/lib/agents/types";
import type { Role, RoleSkill } from "@/types/career";
import type { Profile } from "@/types/profile";
import type { LearnerSkill, Skill, SkillPrerequisite } from "@/types/skill";

type DbClient = SupabaseClient;

export async function loadAgentContext(supabase: DbClient, userId: string, selectedRoleId?: string): Promise<AgentContext> {
  const [profileResult, certificationsResult, projectsResult, skillsResult, learnerSkillsResult, prerequisitesResult, rolesResult, roleSkillsResult, resourcesResult, roadmapResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("certifications").select("*").eq("user_id", userId),
    supabase.from("projects").select("*").eq("user_id", userId),
    supabase.from("skills").select("*"),
    supabase.from("learner_skills").select("*").eq("user_id", userId),
    supabase.from("skill_prerequisites").select("*"),
    supabase.from("roles").select("*"),
    supabase.from("role_skills").select("*"),
    supabase.from("resources").select("*"),
    supabase.from("roadmaps").select("id,role_id,version,status,summary").eq("user_id", userId).eq("status", "active").order("version", { ascending: false }).limit(1).maybeSingle()
  ]);
  const error = [profileResult.error, certificationsResult.error, projectsResult.error, skillsResult.error, learnerSkillsResult.error, prerequisitesResult.error, rolesResult.error, roleSkillsResult.error, resourcesResult.error, roadmapResult.error].find(Boolean);
  if (error) throw error;

  const profileRow = profileResult.data as Record<string, unknown> | null;
  const profile: Profile | null = profileRow ? {
    id: String(profileRow.id), fullName: String(profileRow.full_name ?? ""), githubUsername: profileRow.github_username ? String(profileRow.github_username) : null,
    hoursPerWeek: Number(profileRow.hours_per_week), createdAt: String(profileRow.created_at ?? ""), updatedAt: String(profileRow.updated_at ?? ""),
  } : null;
  const skills = ((skillsResult.data ?? []) as Array<Record<string, unknown>>).map((row) => ({ id: String(row.id), name: String(row.name), category: String(row.category), description: String(row.description ?? "") })) as Skill[];
  const learnerSkills = ((learnerSkillsResult.data ?? []) as Array<Record<string, unknown>>).map((row) => ({ userId, skillId: String(row.skill_id), claimedLevel: Number(row.claimed_level), evidenceScore: Number(row.evidence_score), pKnown: Number(row.p_known), confidence: Number(row.confidence), status: row.status as LearnerSkill["status"], updatedAt: String(row.updated_at ?? "") })) as LearnerSkill[];
  const prerequisites = ((prerequisitesResult.data ?? []) as Array<Record<string, unknown>>).map((row) => ({ skillId: String(row.skill_id), prerequisiteId: String(row.prerequisite_id) })) as SkillPrerequisite[];
  const roles = ((rolesResult.data ?? []) as Array<Record<string, unknown>>).map((row) => ({ id: String(row.id), name: String(row.name), description: String(row.description ?? "") })) as Role[];
  const roleSkills = ((roleSkillsResult.data ?? []) as Array<Record<string, unknown>>).map((row) => ({ roleId: String(row.role_id), skillId: String(row.skill_id), requiredLevel: Number(row.required_level), importance: Number(row.importance), skill: skills.find((skill) => skill.id === String(row.skill_id)) })) as RoleSkill[];
  const resources = ((resourcesResult.data ?? []) as Array<Record<string, unknown>>).map((row) => ({ id: String(row.id), skillId: String(row.skill_id), title: String(row.title), url: String(row.url), type: String(row.type), difficulty: String(row.difficulty), estMinutes: Number(row.est_minutes), provider: String(row.provider) })) as ResourceRecord[];
  const roadmapRow = roadmapResult.data as Record<string, unknown> | null;
  const activeRoadmap = roadmapRow ? { id: String(roadmapRow.id), roleId: String(roadmapRow.role_id), version: Number(roadmapRow.version), status: String(roadmapRow.status), summary: String(roadmapRow.summary ?? "") } : null;

  return { userId, profile, certifications: (certificationsResult.data ?? []) as Array<Record<string, unknown>>, projects: (projectsResult.data ?? []) as Array<Record<string, unknown>>, skills, learnerSkills, prerequisites, roles, roleSkills, resources, selectedRoleId, activeRoadmap };
}
