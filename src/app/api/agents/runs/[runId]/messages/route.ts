import { NextRequest } from "next/server";
import { apiError, requireUser } from "@/lib/services";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { supabase, user } = await requireUser();
    const { runId } = await params;
    const { data: run, error: runError } = await supabase.from("agent_runs").select("id").eq("id", runId).eq("user_id", user.id).maybeSingle();
    if (runError) throw runError;
    if (!run) return Response.json({ error: "Agent run not found" }, { status: 404 });
    const { data, error } = await supabase.from("agent_messages").select("*").eq("run_id", runId).order("created_at", { ascending: true });
    if (error) throw error;
    return Response.json({ messages: data ?? [] });
  } catch (error) {
    return apiError(error);
  }
}
