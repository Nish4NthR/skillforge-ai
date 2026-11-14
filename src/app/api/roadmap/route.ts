import { apiError, requireUser } from "@/lib/services";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data: roadmap, error: roadmapError } = await supabase.from("roadmaps").select("*, roles(*)").eq("user_id", user.id).eq("status", "active").order("version", { ascending: false }).limit(1).maybeSingle();
    if (roadmapError) throw roadmapError;
    if (!roadmap) return Response.json({ roadmap: null, steps: [] });
    const roadmapId = String((roadmap as { id: string }).id);
    const [{ data: steps, error: stepsError }, { data: resources, error: resourcesError }] = await Promise.all([
      supabase.from("roadmap_steps").select("*, skills(*)").eq("roadmap_id", roadmapId).order("position"),
      supabase.from("resources").select("*")
    ]);
    if (stepsError || resourcesError) throw stepsError ?? resourcesError;
    const resourceRows = (resources ?? []) as Array<Record<string, unknown>>;
    const hydratedSteps = ((steps ?? []) as Array<Record<string, unknown>>).map((step) => ({ ...step, resources: resourceRows.filter((resource) => (step.resource_ids as string[] | null)?.includes(String(resource.id))) }));
    return Response.json({ roadmap, steps: hydratedSteps });
  } catch (error) {
    return apiError(error);
  }
}
