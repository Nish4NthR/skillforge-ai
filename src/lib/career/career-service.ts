import type { SupabaseQueryClient } from "@/lib/supabase/query-types";

export async function getCareerCatalog(supabase: SupabaseQueryClient) {
  const [{ data: roles, error: rolesError }, { data: roleSkills, error: roleSkillsError }, { data: skills, error: skillsError }] = await Promise.all([
    supabase.from("roles").select("*").order("name"),
    supabase.from("role_skills").select("*") ,
    supabase.from("skills").select("*")
  ]);
  if (rolesError || roleSkillsError || skillsError) throw rolesError ?? roleSkillsError ?? skillsError;
  return { roles: roles ?? [], roleSkills: roleSkills ?? [], skills: skills ?? [] };
}
