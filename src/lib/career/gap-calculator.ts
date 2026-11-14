import type { LearnerSkill } from "@/types/skill";
import type { RoleSkill, GapResult } from "@/types/career";

export function calculateGap(roleSkills: RoleSkill[], learnerSkills: LearnerSkill[]): GapResult[] {
  const learnerById = new Map(learnerSkills.map((skill) => [skill.skillId, skill]));
  return roleSkills.map((requirement) => {
    if (!Number.isFinite(requirement.requiredLevel) || requirement.requiredLevel < 0 || requirement.requiredLevel > 1) throw new Error("requiredLevel must be between 0 and 1");
    if (!Number.isFinite(requirement.importance) || requirement.importance < 0 || requirement.importance > 1) throw new Error("importance must be between 0 and 1");
    const current = learnerById.get(requirement.skillId)?.pKnown ?? 0;
    if (!Number.isFinite(current) || current < 0 || current > 1) throw new Error("learner mastery must be between 0 and 1");
    const gapScore = Math.max(0, requirement.requiredLevel - current) * requirement.importance;
    return {
      skillId: requirement.skillId,
      skillName: requirement.skill?.name ?? requirement.skillId,
      currentMastery: current,
      requiredMastery: requirement.requiredLevel,
      gapScore,
      priority: (gapScore >= 0.35 ? "high" : gapScore >= 0.15 ? "medium" : "low") as GapResult["priority"],
      status: (current >= requirement.requiredLevel ? "mastered" : current > 0 ? "partial" : "missing") as GapResult["status"],
    };
  }).sort((a, b) => b.gapScore - a.gapScore);
}
