import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentRunType } from "@/lib/agents/types";

export async function createAgentRun(supabase: SupabaseClient, userId: string, runType: AgentRunType, input: unknown) {
  const { data, error } = await supabase.from("agent_runs").insert({ user_id: userId, run_type: runType, status: "running", input, started_at: new Date().toISOString() }).select("id").single();
  if (error) throw error;
  return String((data as { id: string }).id);
}

export async function finishAgentRun(supabase: SupabaseClient, runId: string, status: "completed" | "failed" | "partial", result?: unknown, errorMessage?: string) {
  const { error } = await supabase.from("agent_runs").update({ status, final_result: result ?? null, error_message: errorMessage ?? null, completed_at: new Date().toISOString() }).eq("id", runId);
  if (error) throw error;
}
