import type { Agent } from "@/lib/agents/types";
import { resourceAgentOutputSchema } from "@/lib/ai/schemas";

export const resourceAgent: Agent<"resource"> = {
  name: "resource",
  async run(context, previous) {
    const roadmap = previous.roadmap;
    if (!roadmap) throw new Error("Resource Agent requires Roadmap Agent output.");
    const recommendations = roadmap.steps.map((step) => {
      const resources = context.resources.filter((resource) => resource.skillId === step.skillId).sort((a, b) => a.estMinutes - b.estMinutes).slice(0, 3);
      return { skillId: step.skillId, resourceIds: resources.map((resource) => resource.id), reason: resources.length ? `Curated ${resources[0].provider} resources matched to ${step.skillName}; no URLs were invented.` : "No curated resource is available yet; the learner should request a resource review." };
    });
    return { agent: "resource", output: resourceAgentOutputSchema.parse({ recommendations }), explanation: "Resource recommendations came from verified database records and were matched to roadmap skills." };
  },
};
