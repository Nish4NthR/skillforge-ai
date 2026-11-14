import { NextRequest } from "next/server";
import { z } from "zod";
import { runCareerAnalysis, runSingleAgent } from "@/lib/agents/orchestrator";
import { apiError, requireUser } from "@/lib/services";

const runSchema = z.object({ type: z.enum(["career_analysis", "assessment", "mentor"]), roleId: z.string().uuid().optional(), skillId: z.string().uuid().optional(), question: z.string().trim().min(1).max(4000).optional() });

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const input = runSchema.parse(await request.json());
    const result = input.type === "career_analysis"
      ? await runCareerAnalysis(supabase, user.id, input.roleId)
      : await runSingleAgent(supabase, user.id, input.type, { roleId: input.roleId, skillId: input.skillId, question: input.question });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
