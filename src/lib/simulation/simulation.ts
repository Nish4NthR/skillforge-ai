import { updateLearnerSkill } from "@/lib/mastery/mastery-service";

export type SimulationPersona = "fast_learner" | "struggling_learner" | "career_switcher";

const correctByPersona: Record<SimulationPersona, boolean[]> = {
  fast_learner: [true, true, true, false, true],
  struggling_learner: [false, false, true, false, false],
  career_switcher: [true, false, true, true, true],
};

export function runLearnerSimulation(persona: SimulationPersona, initialMastery = 0.1) {
  let pKnown = initialMastery;
  const observations = correctByPersona[persona].map((correct, index) => {
    const result = updateLearnerSkill(pKnown, correct);
    pKnown = result.updated;
    return { index: index + 1, correct, prior: result.prior, posterior: result.posterior, updated: result.updated, status: result.status };
  });
  return { persona, initialMastery, finalMastery: pKnown, observations, adaptationRecommended: observations.at(-1)?.updated !== undefined && (observations.at(-1)?.updated ?? 0) < 0.6 };
}
