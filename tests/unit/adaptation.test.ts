import { describe, expect, it } from "vitest";
import { ADAPTATION_THRESHOLD, shouldAdaptAssessment } from "@/lib/learning/adaptation";

describe("assessment adaptation trigger", () => {
  it("adapts scores below 60 percent", () => {
    expect(shouldAdaptAssessment(0.59)).toBe(true);
    expect(shouldAdaptAssessment(ADAPTATION_THRESHOLD)).toBe(false);
  });

  it("does not adapt non-finite scores", () => {
    expect(shouldAdaptAssessment(Number.NaN)).toBe(false);
  });
});
