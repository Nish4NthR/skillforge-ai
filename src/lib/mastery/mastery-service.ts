import { initializeMastery, isMastered, updateMasteryOnCorrect, updateMasteryOnIncorrect } from "@/lib/mastery/bkt";

export function initializeLearnerSkill(claimedLevel: number, evidenceScore: number) {
  const mastery = initializeMastery(evidenceScore, claimedLevel);
  return { ...mastery, status: isMastered(mastery.pKnown) ? "mastered" : "developing" as const };
}

export function updateLearnerSkill(pKnown: number, correct: boolean) {
  const result = correct ? updateMasteryOnCorrect(pKnown) : updateMasteryOnIncorrect(pKnown);
  return { ...result, status: isMastered(result.updated) ? "mastered" : "developing" as const };
}
