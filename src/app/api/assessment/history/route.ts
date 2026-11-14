import { apiError, requireUser } from "@/lib/services";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("assessments").select("id,skill_id,roadmap_step_id,status,difficulty,question_count,score,created_at,submitted_at,skills(name)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return Response.json({ assessments: data ?? [] });
  } catch (error) {
    return apiError(error);
  }
}
