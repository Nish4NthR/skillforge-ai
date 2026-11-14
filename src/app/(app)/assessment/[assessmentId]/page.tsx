import { AssessmentClient } from "@/components/assessment/assessment-client";
export default async function AssessmentPage({ params }: { params: Promise<{ assessmentId: string }> }) { const { assessmentId } = await params; return <AssessmentClient assessmentId={assessmentId} />; }
