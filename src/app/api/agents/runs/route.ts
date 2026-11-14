import { apiError, requireUser } from "@/lib/services";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("agent_runs").select("id,run_type,status,started_at,completed_at,error_message,created_at,final_result").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return Response.json({ runs: data ?? [] });
  } catch (error) {
    return apiError(error);
  }
}
