import { generateJson } from "@/lib/ai/gemini";
import { profileAgentOutputSchema, type ProfileAgentOutput } from "@/lib/ai/schemas";
import { profilePrompt } from "@/lib/ai/prompts";
import { isGeminiConfigured } from "@/lib/ai/model-config";
import type { Agent, AgentContext } from "@/lib/agents/types";

function deterministicProfile(context: AgentContext): ProfileAgentOutput {
  const evidence = context.learnerSkills.map((skill) => {
    const catalogSkill = context.skills.find((item) => item.id === skill.skillId);
    return { skillId: skill.skillId, source: "self-reported onboarding", verified: false, confidence: skill.confidence, note: `${catalogSkill?.name ?? skill.skillId} has a claimed level of ${skill.claimedLevel}/5 and requires assessment evidence.` };
  });
  return {
    summary: context.profile ? `${context.profile.fullName} has a baseline containing ${context.learnerSkills.length} self-reported skills and ${context.projects.length} recorded projects.` : "The learner has not completed a profile yet.",
    evidence,
    unverifiedClaims: evidence.map((item) => item.note),
    missingInformation: [!context.profile ? "profile details" : "verified assessment evidence", context.projects.length ? "" : "project evidence"].filter(Boolean),
    assessmentRequirements: context.learnerSkills.length ? ["Assess the highest-impact role gaps before treating claims as mastery."] : ["Complete onboarding and select a target role."],
  };
}

export const profileAgent: Agent<"profile"> = {
  name: "profile",
  async run(context) {
    const fallback = deterministicProfile(context);
    if (!isGeminiConfigured()) return { agent: "profile", output: fallback, explanation: "Profile evidence was summarized deterministically because Gemini is not configured." };
    const output = await generateJson({ prompt: profilePrompt({ profile: context.profile, certifications: context.certifications, projects: context.projects, learnerSkills: context.learnerSkills }), schema: profileAgentOutputSchema.toJSONSchema(), parse: (value) => profileAgentOutputSchema.parse(value), metadata: { feature: "career_analysis", agent: "profile" } });
    return { agent: "profile", output, explanation: "Profile Agent separated learner claims from verifiable evidence and identified assessment needs." };
  },
};
