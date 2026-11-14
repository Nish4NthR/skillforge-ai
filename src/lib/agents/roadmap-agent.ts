import { buildSkillGraph, getMissingPrerequisites, topologicalSort } from "@/lib/skills/skill-graph";
import type { Agent } from "@/lib/agents/types";
import { roadmapAgentOutputSchema, type RoadmapAgentOutput } from "@/lib/ai/schemas";

export const roadmapAgent: Agent<"roadmap"> = {
  name: "roadmap",
  async run(context, previous) {
    const analysis = previous.skill_gap;
    if (!analysis) throw new Error("Roadmap Agent requires Skill Gap Agent output.");
    const mastered = new Set(context.learnerSkills.filter((item) => item.status === "mastered" || item.pKnown >= 0.8).map((item) => item.skillId));
    const graph = buildSkillGraph(context.prerequisites, context.skills.map((item) => item.id));
    const gaps = analysis.gaps.filter((gap) => gap.status !== "mastered");
    const rank = new Map(topologicalSort(graph).map((id, index) => [id, index]));
    const ordered = [...gaps].sort((a, b) => (rank.get(a.skillId) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.skillId) ?? Number.MAX_SAFE_INTEGER) || b.gapScore - a.gapScore);
    const steps: RoadmapAgentOutput["steps"] = ordered.map((gap) => {
      const prerequisites = getMissingPrerequisites(graph, gap.skillId, mastered);
      const skill = context.skills.find((item) => item.id === gap.skillId);
      return {
        skillId: gap.skillId,
        skillName: gap.skillName,
        objective: `Build working proficiency in ${gap.skillName} for the ${analysis.role.name} role.`,
        reason: `This requirement has a ${gap.priority} priority gap (${Math.round(gap.gapScore * 100)} weighted points) and is ordered after its prerequisites.`,
        prerequisiteSkillIds: prerequisites,
        estimatedMinutes: Math.max(120, Math.round((180 + gap.gapScore * 360) / Math.max(1, (context.profile?.hoursPerWeek ?? 5) / 5))),
        priority: gap.priority,
        completionCriteria: `Explain the core concepts of ${skill?.name ?? gap.skillName}, complete a focused assessment, and reach the mastery threshold.`,
        status: prerequisites.length ? "locked" : "not_started",
      };
    });
    const output = roadmapAgentOutputSchema.parse({ summary: `A prerequisite-aware roadmap for ${analysis.role.name} with ${steps.length} active gap steps.`, steps });
    return { agent: "roadmap", output, explanation: "Roadmap steps were generated from actual role gaps and topologically ordered prerequisites." };
  },
};
