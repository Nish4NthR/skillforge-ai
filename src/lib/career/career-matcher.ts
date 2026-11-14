import type { CareerAnalysis, Role, RoleSkill } from "@/types/career";
import type { LearnerSkill } from "@/types/skill";
import { calculateGap } from "./gap-calculator";

export function matchCareer(role: Role, roleSkills: RoleSkill[], learnerSkills: LearnerSkill[]): CareerAnalysis {
  const gaps = calculateGap(roleSkills, learnerSkills);
  const masteredSkills = gaps.filter((gap) => gap.status === "mastered").length;
  const weightedRequired = roleSkills.reduce((sum, skill) => sum + skill.importance, 0);
  const importanceBySkill = new Map(roleSkills.map((skill) => [skill.skillId, skill.importance]));
  const weightedCovered = gaps.reduce((sum, gap) => sum + (importanceBySkill.get(gap.skillId) ?? 0) * Math.min(1, gap.currentMastery / Math.max(gap.requiredMastery, 0.01)), 0);
  return { role, gaps, masteredSkills, requiredSkills: roleSkills.length, skillCoverage: weightedRequired ? Math.min(1, weightedCovered / weightedRequired) : 0 };
}

export function compareCareers(roles: Array<{ role: Role; skills: RoleSkill[] }>, learnerSkills: LearnerSkill[]) {
  return roles.map(({ role, skills }) => matchCareer(role, skills, learnerSkills)).sort((a, b) => b.skillCoverage - a.skillCoverage);
}
