export const ADAPTATION_THRESHOLD = 0.6;

export function shouldAdaptAssessment(score: number) {
  return Number.isFinite(score) && score < ADAPTATION_THRESHOLD;
}
