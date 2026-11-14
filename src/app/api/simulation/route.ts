import { apiError, requireUser } from "@/lib/services";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("sim_runs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    if (error) throw error;
    return Response.json({ simulations: data ?? [] });
  } catch (error) { return apiError(error); }
}
