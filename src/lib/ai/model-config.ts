export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
export const GEMINI_MAX_RETRIES = 2;
export const GEMINI_TIMEOUT_MS = 20_000;

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}
