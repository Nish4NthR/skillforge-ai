export const DEFAULT_BKT_CONFIG: BktConfig = {
  slip: 0.1,
  guess: 0.2,
  learnRate: 0.15,
  masteryThreshold: 0.85,
};

export type BktConfig = {
  slip: number;
  guess: number;
  learnRate: number;
  masteryThreshold: number;
};
