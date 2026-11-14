import { NextRequest } from "next/server";
import { apiError, requireUser } from "@/lib/services";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ roadmapId: string }> }) {
  try {
    const { supabase, user } = await requireUser();
    const { roadmapId } = await params;
    const { data: roadmap, error: roadmapError } = await supabase.from("roadmaps").select("*, roles(*)").eq("id", roadmapId).eq("user_id", user.id).maybeSingle();
    if (roadmapError) throw roadmapError;
    if (!roadmap) return Response.json({ error: "Roadmap not found" }, { status: 404 });
    const { data: steps, error } = await supabase.from("roadmap_steps").select("*, skills(*)").eq("roadmap_id", roadmapId).order("position");
    if (error) throw error;
    return Response.json({ roadmap, steps: steps ?? [] });
  } catch (error) {
    return apiError(error);
  }
}
