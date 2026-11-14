import { describe, expect, it } from "vitest";
import { classifyGeminiError } from "@/lib/ai/errors";
import { getApiErrorMessage } from "@/lib/utils";

describe("AI error classification", () => {
  it("classifies a retired model as non-retryable model unavailability", () => {
    const error = classifyGeminiError({ status: 404, message: "model is no longer available" });
    expect(error.code).toBe("GEMINI_MODEL_UNAVAILABLE");
    expect(error.retryable).toBe(false);
    expect(error.statusCode).toBe(503);
  });

  it("classifies rate limiting as retryable", () => {
    const error = classifyGeminiError({ status: 429, message: "Too many requests" });
    expect(error.code).toBe("GEMINI_RATE_LIMITED");
    expect(error.retryable).toBe(true);
  });

  it("does not multiply provider timeouts inside a synchronous request", () => {
    const error = classifyGeminiError(new Error("request timed out"));
    expect(error.code).toBe("GEMINI_TIMEOUT");
    expect(error.retryable).toBe(false);
    expect(error.statusCode).toBe(504);
  });

  it("extracts structured API messages without rendering an object", () => {
    expect(getApiErrorMessage({ error: { code: "GEMINI_TIMEOUT", message: "Try again shortly." } }, "fallback")).toBe("Try again shortly.");
    expect(getApiErrorMessage({ error: "legacy error" }, "fallback")).toBe("legacy error");
    expect(getApiErrorMessage({}, "fallback")).toBe("fallback");
  });
});
