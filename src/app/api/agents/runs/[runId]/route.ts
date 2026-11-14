import { NextRequest } from "next/server";
import { apiError, requireUser } from "@/lib/services";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { supabase, user } = await requireUser();
    const { runId } = await params;
    const { data, error } = await supabase.from("agent_runs").select("*").eq("id", runId).eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    if (!data) return Response.json({ error: "Agent run not found" }, { status: 404 });
    return Response.json({ run: data });
  } catch (error) {
    return apiError(error);
  }
}
