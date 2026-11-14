export type SkillCategory =
  | "Programming"
  | "Frontend"
  | "Backend"
  | "Data Science"
  | "Machine Learning"
  | "Deep Learning"
  | "Databases"
  | "Tools";

export type MasteryStatus = "mastered" | "developing" | "not_started";

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory | string;
  description: string;
}

export interface LearnerSkill {
  userId: string;
  skillId: string;
  skill?: Skill;
  claimedLevel: number;
  evidenceScore: number;
  pKnown: number;
  confidence: number;
  status: MasteryStatus;
  updatedAt?: string;
}

export interface SkillPrerequisite {
  skillId: string;
  prerequisiteId: string;
}
