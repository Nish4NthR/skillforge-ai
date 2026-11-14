import { describe, expect, it } from "vitest";
import { runLearnerSimulation } from "@/lib/simulation/simulation";

describe("learner simulations", () => {
  it("shows a fast learner progressing more than a struggling learner", () => {
    const fast = runLearnerSimulation("fast_learner");
    const struggling = runLearnerSimulation("struggling_learner");
    expect(fast.finalMastery).toBeGreaterThan(struggling.finalMastery);
    expect(fast.observations).toHaveLength(5);
  });

  it("marks poor performance for adaptation", () => {
    expect(runLearnerSimulation("struggling_learner").adaptationRecommended).toBe(true);
  });
});
