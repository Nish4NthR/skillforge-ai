import type { Skill } from "@/types/skill";

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface RoleSkill {
  roleId: string;
  skillId: string;
  skill?: Skill;
  requiredLevel: number;
  importance: number;
}

export interface GapResult {
  skillId: string;
  skillName: string;
  currentMastery: number;
  requiredMastery: number;
  gapScore: number;
  priority: "high" | "medium" | "low";
  status: "mastered" | "partial" | "missing";
}

export interface CareerAnalysis {
  role: Role;
  gaps: GapResult[];
  skillCoverage: number;
  masteredSkills: number;
  requiredSkills: number;
}
