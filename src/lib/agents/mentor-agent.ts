import { generateJson } from "@/lib/ai/gemini";
import { mentorAgentOutputSchema } from "@/lib/ai/schemas";
import { mentorPrompt } from "@/lib/ai/prompts";
import { isGeminiConfigured } from "@/lib/ai/model-config";
import type { Agent } from "@/lib/agents/types";

export const mentorAgent: Agent<"mentor"> = {
  name: "mentor",
  async run(context, previous) {
    const question = context.question?.trim();
    if (!question) throw new Error("Mentor question is required.");
    const contextPayload = { profile: context.profile, activeRoadmap: context.activeRoadmap, proposedRoadmap: previous.roadmap, learnerSkills: context.learnerSkills, skills: context.skills };
    if (isGeminiConfigured()) {
      const output = await generateJson({ prompt: mentorPrompt(question, contextPayload), schema: mentorAgentOutputSchema.toJSONSchema(), parse: (value) => mentorAgentOutputSchema.parse(value) });
      return { agent: "mentor", output, explanation: "Mentor response was grounded in the learner context and cannot modify mastery directly." };
    }
    const firstGap = context.skills.find((skill) => context.learnerSkills.some((learnerSkill) => learnerSkill.skillId === skill.id && learnerSkill.status !== "mastered"));
    return { agent: "mentor", output: { answer: firstGap ? `Your result indicates that ${firstGap.name} needs reinforcement. ${previous.roadmap?.summary ?? "The roadmap has been recalculated from your current mastery."} Start with the prerequisite-friendly step, then take the assessment again. This explanation is based on the deterministic fallback because Gemini is not configured.` : "Complete onboarding and choose a career goal so I can answer with learner-specific context.", referencedSkills: firstGap ? [firstGap.id] : [], suggestedActions: firstGap ? [`Review the ${firstGap.name} roadmap step`, "Take the related assessment"] : ["Complete onboarding"] }, explanation: "A contextual fallback mentor response was returned because Gemini is not configured." };
  },
};
