import { NextRequest } from "next/server";
import { apiError, requireUser } from "@/lib/services";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ assessmentId: string }> }) {
  try {
    const { supabase, user } = await requireUser();
    const { assessmentId } = await params;
    const { data: assessment, error: assessmentError } = await supabase.from("assessments").select("id,skill_id,roadmap_step_id,status,difficulty,question_count,score,created_at,submitted_at,skills(name)").eq("id", assessmentId).eq("user_id", user.id).maybeSingle();
    if (assessmentError) throw assessmentError;
    if (!assessment) return Response.json({ error: "Assessment not found" }, { status: 404 });
    const { data: questions, error } = await supabase.from("questions").select("id,skill_id,question_text,difficulty,options,concept").eq("assessment_id", assessmentId);
    if (error) throw error;
    return Response.json({ assessment, questions: questions ?? [] });
  } catch (error) { return apiError(error); }
}
