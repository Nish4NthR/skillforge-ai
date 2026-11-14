import { DEFAULT_BKT_CONFIG, type BktConfig } from "./mastery-config";

export interface MasteryUpdate {
  prior: number;
  posterior: number;
  updated: number;
  observation: "correct" | "incorrect" | "prior";
}

function assertProbability(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be a finite probability between 0 and 1`);
  }
}

function validateConfig(config: BktConfig) {
  assertProbability(config.slip, "slip");
  assertProbability(config.guess, "guess");
  assertProbability(config.learnRate, "learnRate");
  assertProbability(config.masteryThreshold, "masteryThreshold");
  if (config.slip === 1 && config.guess === 0) throw new Error("slip and guess create an undefined posterior");
}

export function calculatePosterior(
  pKnown: number,
  correct: boolean,
  config: BktConfig = DEFAULT_BKT_CONFIG,
): number {
  assertProbability(pKnown, "pKnown");
  validateConfig(config);
  const likelihoodKnown = correct ? 1 - config.slip : config.slip;
  const likelihoodUnknown = correct ? config.guess : 1 - config.guess;
  const denominator = pKnown * likelihoodKnown + (1 - pKnown) * likelihoodUnknown;
  if (denominator === 0) throw new Error("Unable to calculate a posterior with the supplied parameters");
  const posterior = (pKnown * likelihoodKnown) / denominator;
  assertProbability(posterior, "posterior");
  return posterior;
}

export function applyLearningProbability(posterior: number, learnRate = DEFAULT_BKT_CONFIG.learnRate): number {
  assertProbability(posterior, "posterior");
  assertProbability(learnRate, "learnRate");
  const updated = posterior + (1 - posterior) * learnRate;
  assertProbability(updated, "updated mastery");
  return updated;
}

export function updateMasteryOnCorrect(pKnown: number, config: BktConfig = DEFAULT_BKT_CONFIG): MasteryUpdate {
  const posterior = calculatePosterior(pKnown, true, config);
  return { prior: pKnown, posterior, updated: applyLearningProbability(posterior, config.learnRate), observation: "correct" };
}

export function updateMasteryOnIncorrect(pKnown: number, config: BktConfig = DEFAULT_BKT_CONFIG): MasteryUpdate {
  const posterior = calculatePosterior(pKnown, false, config);
  return { prior: pKnown, posterior, updated: applyLearningProbability(posterior, config.learnRate), observation: "incorrect" };
}

export function initializeMastery(evidenceScore = 0, claimedLevel = 0): { pKnown: number; confidence: number } {
  assertProbability(evidenceScore, "evidenceScore");
  if (!Number.isFinite(claimedLevel) || claimedLevel < 0 || claimedLevel > 5) {
    throw new Error("claimedLevel must be between 0 and 5");
  }
  const pKnown = Math.max(0.1, Math.min(0.6, 0.1 + evidenceScore * 0.3 + (claimedLevel / 5) * 0.2));
  return { pKnown, confidence: evidenceScore };
}

export function isMastered(pKnown: number, threshold = DEFAULT_BKT_CONFIG.masteryThreshold) {
  assertProbability(pKnown, "pKnown");
  assertProbability(threshold, "threshold");
  return pKnown >= threshold;
}
