export class GeminiConfigurationError extends Error {
  constructor() {
    super("Gemini is not configured. Add GEMINI_API_KEY to the server environment.");
    this.name = "GeminiConfigurationError";
  }
}

export class GeminiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiResponseError";
  }
}

export function isRetryableGeminiError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return /429|rate limit|resource exhausted|timeout|timed out|503|502|500|temporarily unavailable/.test(message);
}
