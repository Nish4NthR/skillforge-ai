import { apiError, requireUser } from "@/lib/services";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("mentor_messages").select("id,role,content,context,agent_run_id,created_at").eq("user_id", user.id).order("created_at", { ascending: true }).limit(100);
    if (error) throw error;
    return Response.json({ messages: data ?? [] });
  } catch (error) {
    return apiError(error);
  }
}
