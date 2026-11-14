import type { SupabaseQueryClient } from "@/lib/supabase/query-types";

export async function getSkillCatalog(supabase: SupabaseQueryClient) {
  const { data, error } = await supabase.from("skills").select("id,name,category,description").order("category").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getLearnerSkillRecords(supabase: SupabaseQueryClient, userId: string) {
  const { data, error } = await supabase.from("learner_skills").select("*").eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}
