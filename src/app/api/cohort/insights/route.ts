import { apiError, requireUser } from "@/lib/services";

export async function GET() {
  try {
    await requireUser();
    return Response.json({ status: "insufficient_data", insights: [], message: "Cohort intelligence is privacy-safe only when an authorized aggregate cohort has enough learners. No aggregate cohort is configured yet." });
  } catch (error) { return apiError(error); }
}
