import { describe, expect, it } from "vitest";
import { applyLearningProbability, calculatePosterior, initializeMastery, isMastered, updateMasteryOnCorrect, updateMasteryOnIncorrect } from "@/lib/mastery/bkt";

describe("Bayesian Knowledge Tracing", () => {
  it("raises mastery after a correct answer", () => expect(updateMasteryOnCorrect(0.4).updated).toBeGreaterThan(0.4));
  it("lowers mastery after an incorrect answer", () => expect(updateMasteryOnIncorrect(0.8).updated).toBeLessThan(0.8));
  it("keeps probability boundaries safe", () => { expect(calculatePosterior(0, true)).toBeGreaterThanOrEqual(0); expect(calculatePosterior(1, false)).toBeLessThanOrEqual(1); expect(applyLearningProbability(1)).toBe(1); });
  it("rejects invalid inputs", () => { expect(() => calculatePosterior(1.2, true)).toThrow(); expect(() => initializeMastery(0, 6)).toThrow(); });
  it("uses the mastery threshold", () => { expect(isMastered(0.85)).toBe(true); expect(isMastered(0.849)).toBe(false); });
});
