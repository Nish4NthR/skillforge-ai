import { GoogleGenAI } from "@google/genai";
import { GEMINI_MAX_RETRIES, GEMINI_MODEL, GEMINI_TIMEOUT_MS, isGeminiConfigured } from "@/lib/ai/model-config";
import { GeminiConfigurationError, GeminiResponseError, isRetryableGeminiError } from "@/lib/ai/errors";

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

type GenerateJsonInput<T> = {
  prompt: string;
  schema: unknown;
  parse: (value: unknown) => T;
};

export async function generateJson<T>({ prompt, schema, parse }: GenerateJsonInput<T>) {
  if (!isGeminiConfigured()) throw new GeminiConfigurationError();
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
          httpOptions: { timeout: GEMINI_TIMEOUT_MS },
        },
      });
      if (!response.text) throw new GeminiResponseError("Gemini returned an empty response.");
      return parse(parseJson(response.text));
    } catch (error) {
      lastError = error;
      if (attempt >= GEMINI_MAX_RETRIES || !isRetryableGeminiError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new GeminiResponseError("Gemini request failed.");
}

export async function generateText(prompt: string) {
  if (!isGeminiConfigured()) throw new GeminiConfigurationError();
  const response = await getClient().models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: { temperature: 0.3, httpOptions: { timeout: GEMINI_TIMEOUT_MS } } });
  if (!response.text) throw new GeminiResponseError("Gemini returned an empty response.");
  return response.text;
}
