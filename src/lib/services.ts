import { ZodError } from "zod";
import { createRequestId } from "@/lib/ai/logger";
import { SkillForgeError, type SkillForgeErrorCode } from "@/lib/ai/errors";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { supabase, user };
}

function normalizeApiError(error: unknown): { code: SkillForgeErrorCode; message: string; retryable: boolean; statusCode: number } {
  if (error instanceof SkillForgeError) return { code: error.code, message: error.message, retryable: error.retryable, statusCode: error.statusCode };
  if (error instanceof ZodError) return { code: "INVALID_REQUEST", message: "Invalid request.", retryable: false, statusCode: 400 };
  if (error instanceof Error && error.message === "Unauthorized") return { code: "UNAUTHORIZED_REQUEST", message: "Authentication is required.", retryable: false, statusCode: 401 };
  if (error && typeof error === "object" && "code" in error && typeof (error as { code?: unknown }).code === "string") {
    return { code: "DATABASE_ERROR", message: "A data service error occurred.", retryable: false, statusCode: 500 };
  }
  return { code: "INTERNAL_SERVER_ERROR", message: "Unable to complete that request right now.", retryable: false, statusCode: 500 };
}

export function apiError(error: unknown, requestId = createRequestId("api")) {
  const normalized = normalizeApiError(error);
  console.error("SkillForge API error", JSON.stringify({ requestId, code: normalized.code, retryable: normalized.retryable, statusCode: normalized.statusCode }));
  return Response.json({
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      retryable: normalized.retryable,
      requestId,
    },
  }, { status: normalized.statusCode, headers: { "X-Request-Id": requestId } });
}
