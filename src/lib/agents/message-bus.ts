import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentMessage } from "@/lib/agents/types";

export async function persistAgentMessage(supabase: SupabaseClient, runId: string, message: AgentMessage) {
  const { error } = await supabase.from("agent_messages").insert({
    run_id: runId,
    sender_agent: message.senderAgent,
    receiver_agent: message.receiverAgent ?? null,
    message_type: message.messageType,
    payload: message.payload,
  });
  if (error) throw error;
}
