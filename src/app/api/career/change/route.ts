import { NextRequest } from "next/server";
import { z } from "zod";
import { runCareerAnalysis } from "@/lib/agents/orchestrator";
import { apiError, requireUser } from "@/lib/services";

const changeCareerSchema = z.object({ roleId: z.string().uuid() });

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const { roleId } = changeCareerSchema.parse(await request.json());
    const { data: role, error: roleError } = await supabase.from("roles").select("id,name,description").eq("id", roleId).maybeSingle();
    if (roleError) throw roleError;
    if (!role) return Response.json({ error: "Career role not found" }, { status: 404 });
    const [{ data: previousGoal, error: previousGoalError }, { data: previousRoadmap, error: previousRoadmapError }] = await Promise.all([
      supabase.from("goals").select("id,role_id,created_at,roles(id,name,description)").eq("user_id", user.id).eq("active", true).maybeSingle(),
      supabase.from("roadmaps").select("id,version,summary,role_id,created_at").eq("user_id", user.id).eq("status", "active").order("version", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (previousGoalError || previousRoadmapError) throw previousGoalError ?? previousRoadmapError;
    const { error: deactivateError } = await supabase.from("goals").update({ active: false }).eq("user_id", user.id).eq("active", true);
    if (deactivateError) throw deactivateError;
    const { data: goal, error: goalError } = await supabase.from("goals").insert({ user_id: user.id, role_id: roleId, active: true }).select("*").single();
    if (goalError) throw goalError;
    const analysis = await runCareerAnalysis(supabase, user.id, roleId);
    return Response.json({ goal, analysis, comparison: { previous: { goal: previousGoal, roadmap: previousRoadmap }, next: { role, roadmapId: analysis.roadmapId, roadmap: analysis.roadmap } } }, { status: 201 });
  } catch (error) { return apiError(error); }
}
