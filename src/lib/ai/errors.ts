export type SkillForgeErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHORIZED_REQUEST"
  | "DATABASE_ERROR"
  | "GEMINI_API_KEY_MISSING"
  | "GEMINI_AUTHENTICATION_FAILED"
  | "GEMINI_QUOTA_EXCEEDED"
  | "GEMINI_RATE_LIMITED"
  | "GEMINI_MODEL_UNAVAILABLE"
  | "GEMINI_TIMEOUT"
  | "GEMINI_INVALID_RESPONSE"
  | "GEMINI_REQUEST_FAILED"
  | "AGENT_EXECUTION_FAILED"
  | "AGENT_VALIDATION_FAILED"
  | "ORCHESTRATION_FAILED"
  | "INTERNAL_SERVER_ERROR";

type SkillForgeErrorOptions = {
  retryable?: boolean;
  statusCode?: number;
};

export class SkillForgeError extends Error {
  readonly code: SkillForgeErrorCode;
  readonly retryable: boolean;
  readonly statusCode: number;

  constructor(code: SkillForgeErrorCode, message: string, options: SkillForgeErrorOptions = {}) {
    super(message);
    this.name = "SkillForgeError";
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.statusCode = options.statusCode ?? 500;
  }
}

export class GeminiConfigurationError extends SkillForgeError {
  constructor() {
    super("GEMINI_API_KEY_MISSING", "The AI service is not configured.", { statusCode: 503 });
    this.name = "GeminiConfigurationError";
  }
}

export class GeminiAuthenticationError extends SkillForgeError {
  constructor() {
    super("GEMINI_AUTHENTICATION_FAILED", "The AI service rejected its server credential.", { statusCode: 502 });
    this.name = "GeminiAuthenticationError";
  }
}

export class GeminiQuotaError extends SkillForgeError {
  constructor() {
    super("GEMINI_QUOTA_EXCEEDED", "The AI service quota has been exhausted.", { statusCode: 429 });
    this.name = "GeminiQuotaError";
  }
}

export class GeminiRateLimitError extends SkillForgeError {
  constructor() {
    super("GEMINI_RATE_LIMITED", "The AI service is temporarily rate limited.", { retryable: true, statusCode: 429 });
    this.name = "GeminiRateLimitError";
  }
}

export class GeminiModelUnavailableError extends SkillForgeError {
  constructor() {
    super("GEMINI_MODEL_UNAVAILABLE", "The configured AI model is unavailable.", { statusCode: 503 });
    this.name = "GeminiModelUnavailableError";
  }
}

export class GeminiTimeoutError extends SkillForgeError {
  constructor() {
    super("GEMINI_TIMEOUT", "The AI service took too long to respond.", { statusCode: 504 });
    this.name = "GeminiTimeoutError";
  }
}

export class GeminiResponseError extends SkillForgeError {
  constructor(diagnosticMessage = "Gemini returned an invalid response.") {
    super("GEMINI_INVALID_RESPONSE", "The AI service returned an invalid response.", { statusCode: 502 });
    this.name = "GeminiResponseError";
    void diagnosticMessage;
  }
}

export class GeminiRequestError extends SkillForgeError {
  constructor(retryable = false) {
    super("GEMINI_REQUEST_FAILED", "The AI service request failed.", { retryable, statusCode: 502 });
    this.name = "GeminiRequestError";
  }
}

export class AgentValidationError extends SkillForgeError {
  constructor() {
    super("AGENT_VALIDATION_FAILED", "The AI agent returned data that failed validation.", { statusCode: 502 });
    this.name = "AgentValidationError";
  }
}

export class AgentExecutionError extends SkillForgeError {
  constructor() {
    super("AGENT_EXECUTION_FAILED", "The AI agent could not complete this step.", { statusCode: 500 });
    this.name = "AgentExecutionError";
  }
}

export class OrchestrationError extends SkillForgeError {
  constructor() {
    super("ORCHESTRATION_FAILED", "The AI workflow could not complete.", { statusCode: 500 });
    this.name = "OrchestrationError";
  }
}

export class DatabaseError extends SkillForgeError {
  constructor() {
    super("DATABASE_ERROR", "A data service error occurred.", { statusCode: 500 });
    this.name = "DatabaseError";
  }
}

export function getErrorStatus(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as { status?: unknown; code?: unknown; error?: { code?: unknown } };
  const status = candidate.status ?? candidate.code ?? candidate.error?.code;
  return typeof status === "number" ? status : typeof status === "string" && /^\d{3}$/.test(status) ? Number(status) : undefined;
}

function getProviderMessage(error: unknown) {
  if (error instanceof Error) return error.message.toLowerCase();
  if (error && typeof error === "object") return JSON.stringify(error).toLowerCase();
  return String(error).toLowerCase();
}

export function classifyGeminiError(error: unknown): SkillForgeError {
  if (error instanceof SkillForgeError) return error;

  const status = getErrorStatus(error);
  const message = getProviderMessage(error);
  if (status === 401 || status === 403 || /api key|authentication|unauthorized|permission denied/.test(message)) return new GeminiAuthenticationError();
  if (status === 404 || /model .*?(not found|unavailable|no longer available)|not found.*model/.test(message)) return new GeminiModelUnavailableError();
  if (/quota|billing|exceeded/.test(message)) return new GeminiQuotaError();
  if (status === 429 || /rate limit|too many requests|resource exhausted/.test(message)) return new GeminiRateLimitError();
  if (/timeout|timed out|etimedout|aborterror/.test(message)) return new GeminiTimeoutError();
  if (status !== undefined && status >= 500) return new GeminiRequestError(true);
  return new GeminiRequestError(false);
}

export function isRetryableGeminiError(error: unknown) {
  return classifyGeminiError(error).retryable;
}

export function normalizeAgentError(error: unknown) {
  if (error instanceof SkillForgeError) return error;
  return new AgentExecutionError();
}
