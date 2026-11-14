import { NextRequest } from "next/server";
import { runSingleAgent } from "@/lib/agents/orchestrator";
import { apiError, requireUser } from "@/lib/services";
import { mentorMessageSchema } from "@/lib/validation/learning.schema";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("mentor_messages").select("id,role,content,context,agent_run_id,created_at").eq("user_id", user.id).order("created_at", { ascending: true }).limit(100);
    if (error) throw error;
    return Response.json({ messages: data ?? [] });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const { question } = mentorMessageSchema.parse(await request.json());
    const { error: userMessageError } = await supabase.from("mentor_messages").insert({ user_id: user.id, role: "user", content: question, context: {} });
    if (userMessageError) throw userMessageError;
    const result = await runSingleAgent(supabase, user.id, "mentor", { question });
    const output = result.output as { answer: string; referencedSkills: string[]; suggestedActions: string[] };
    const content = output.answer;
    const { data: assistantMessage, error: assistantError } = await supabase.from("mentor_messages").insert({ user_id: user.id, role: "assistant", content, context: { referencedSkills: output.referencedSkills, suggestedActions: output.suggestedActions }, agent_run_id: result.runId }).select("id,role,content,context,agent_run_id,created_at").single();
    if (assistantError) throw assistantError;
    return Response.json({ message: assistantMessage }, { status: 201 });
  } catch (error) { return apiError(error); }
}
