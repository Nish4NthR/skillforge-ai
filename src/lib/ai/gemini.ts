import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { GEMINI_MAX_RETRIES, GEMINI_MODEL, GEMINI_TIMEOUT_MS, isGeminiConfigured } from "@/lib/ai/model-config";
import { AgentValidationError, classifyGeminiError, GeminiConfigurationError, GeminiResponseError } from "@/lib/ai/errors";
import { createRequestId, logAiEvent } from "@/lib/ai/logger";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new GeminiConfigurationError();
  return new GoogleGenAI({ apiKey });
}

function parseJson(text: string) {
  const normalized = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(normalized) as unknown;
  } catch {
    throw new GeminiResponseError("Gemini returned malformed JSON.");
  }
}

type GenerateMetadata = { feature?: string; agent?: string };
type GenerateJsonInput<T> = {
  prompt: string;
  schema: unknown;
  parse: (value: unknown) => T;
  metadata?: GenerateMetadata;
};

export async function generateJson<T>({ prompt, schema, parse, metadata }: GenerateJsonInput<T>) {
  const requestId = createRequestId();
  const startedAt = Date.now();
  if (!isGeminiConfigured()) {
    const error = new GeminiConfigurationError();
    logAiEvent({ requestId, ...metadata, status: "failure", errorCategory: error.code, retryAttempts: 0, responseValidationStatus: "not_applicable", durationMs: Date.now() - startedAt });
    throw error;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= GEMINI_MAX_RETRIES; attempt += 1) {
    try {
      const response = await getClient().models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          temperature: 0.2,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          httpOptions: { timeout: GEMINI_TIMEOUT_MS },
        },
      });
      if (!response.text) throw new GeminiResponseError("Gemini returned an empty response.");
      let output: T;
      try {
        const parsed = parseJson(response.text);
        output = parse(parsed);
      } catch (error) {
        if (error instanceof GeminiResponseError) throw error;
        throw new AgentValidationError();
      }
      logAiEvent({ requestId, ...metadata, status: "success", retryAttempts: attempt, responseValidationStatus: "valid", durationMs: Date.now() - startedAt });
      return output;
    } catch (error) {
      const classified = classifyGeminiError(error);
      lastError = classified;
      if (attempt >= GEMINI_MAX_RETRIES || !classified.retryable) {
        logAiEvent({ requestId, ...metadata, status: "failure", errorCategory: classified.code, retryAttempts: attempt, responseValidationStatus: classified.code === "GEMINI_INVALID_RESPONSE" || classified.code === "AGENT_VALIDATION_FAILED" ? "invalid" : "not_applicable", durationMs: Date.now() - startedAt });
        throw classified;
      }
      logAiEvent({ requestId, ...metadata, status: "retry", errorCategory: classified.code, retryAttempts: attempt + 1, responseValidationStatus: "not_applicable", durationMs: Date.now() - startedAt });
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new GeminiResponseError("Gemini request failed.");
}

export async function generateText(prompt: string, metadata?: GenerateMetadata) {
  const requestId = createRequestId();
  const startedAt = Date.now();
  if (!isGeminiConfigured()) throw new GeminiConfigurationError();
  try {
    const response = await getClient().models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: { temperature: 0.3, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }, httpOptions: { timeout: GEMINI_TIMEOUT_MS } } });
    if (!response.text) throw new GeminiResponseError("Gemini returned an empty response.");
    logAiEvent({ requestId, ...metadata, status: "success", retryAttempts: 0, responseValidationStatus: "not_applicable", durationMs: Date.now() - startedAt });
    return response.text;
  } catch (error) {
    const classified = classifyGeminiError(error);
    logAiEvent({ requestId, ...metadata, status: "failure", errorCategory: classified.code, retryAttempts: 0, responseValidationStatus: "not_applicable", durationMs: Date.now() - startedAt });
    throw classified;
  }
}
