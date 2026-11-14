import { matchCareer } from "@/lib/career/career-matcher";
import type { Agent } from "@/lib/agents/types";

export const skillGapAgent: Agent<"skill_gap"> = {
  name: "skill_gap",
  async run(context) {
    const role = context.roles.find((item) => item.id === context.selectedRoleId) ?? context.roles[0];
    if (!role) throw new Error("No career role is available for analysis.");
    const roleSkills = context.roleSkills.filter((item) => item.roleId === role.id);
    const analysis = matchCareer(role, roleSkills, context.learnerSkills);
    return { agent: "skill_gap", output: analysis, explanation: "Skill gaps were calculated from deterministic BKT mastery, role weights, and the existing prerequisite graph." };
  },
};
