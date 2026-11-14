import { GEMINI_MODEL } from "@/lib/ai/model-config";
import type { SkillForgeErrorCode } from "@/lib/ai/errors";

export type AiLogEvent = {
  requestId: string;
  feature?: string;
  agent?: string;
  model?: string;
  status: "success" | "failure" | "retry";
  errorCategory?: SkillForgeErrorCode;
  retryAttempts: number;
  responseValidationStatus: "valid" | "invalid" | "not_applicable";
  durationMs: number;
};

export function createRequestId(prefix = "ai") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function logAiEvent(event: AiLogEvent) {
  const payload = { ...event, model: event.model ?? GEMINI_MODEL };
  if (event.status === "failure") console.error("SkillForge AI event", payload);
  else if (event.status === "retry") console.warn("SkillForge AI event", payload);
  else console.info("SkillForge AI event", payload);
}
