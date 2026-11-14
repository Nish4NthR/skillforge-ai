import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, requireUser } from "@/lib/services";

const querySchema = z.object({ skillId: z.string().uuid().optional() });

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const { skillId } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    let query = supabase.from("mastery_history").select("*, skills(name)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    if (skillId) query = query.eq("skill_id", skillId);
    const { data, error } = await query;
    if (error) throw error;
    return Response.json({ history: data ?? [] });
  } catch (error) { return apiError(error); }
}
