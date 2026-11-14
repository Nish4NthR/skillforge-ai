import { NextRequest } from "next/server";
import { z } from "zod";
import { runLearnerSimulation } from "@/lib/simulation/simulation";
import { apiError, requireUser } from "@/lib/services";

const simulationSchema = z.object({ persona: z.enum(["fast_learner", "struggling_learner", "career_switcher"]) });

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const { persona } = simulationSchema.parse(await request.json());
    const { data: row, error: insertError } = await supabase.from("sim_runs").insert({ user_id: user.id, persona, status: "running", input: { persona } }).select("id").single();
    if (insertError) throw insertError;
    const result = runLearnerSimulation(persona);
    const { data, error } = await supabase.from("sim_runs").update({ status: "completed", result, completed_at: new Date().toISOString() }).eq("id", String((row as { id: string }).id)).eq("user_id", user.id).select("*").single();
    if (error) throw error;
    return Response.json({ simulation: data }, { status: 201 });
  } catch (error) { return apiError(error); }
}
