// Keep the default on a currently supported stable model. Deployments may override
// this with GEMINI_MODEL, but an old model id must not silently break every AI route.
export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
export const GEMINI_MAX_RETRIES = 2;
export const GEMINI_TIMEOUT_MS = 20_000;

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}
