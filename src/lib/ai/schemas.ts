import { z } from "zod";

const prioritySchema = z.enum(["high", "medium", "low"]);
const difficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

export const profileAgentOutputSchema = z.object({
  summary: z.string().min(1),
  evidence: z.array(z.object({ skillId: z.string(), source: z.string(), verified: z.boolean(), confidence: z.number().min(0).max(1), note: z.string() })),
  unverifiedClaims: z.array(z.string()),
  missingInformation: z.array(z.string()),
  assessmentRequirements: z.array(z.string()),
});

export const roadmapAgentOutputSchema = z.object({
  summary: z.string().min(1),
  steps: z.array(z.object({
    skillId: z.string(),
    skillName: z.string(),
    objective: z.string(),
    reason: z.string(),
    prerequisiteSkillIds: z.array(z.string()),
    estimatedMinutes: z.number().int().positive(),
    priority: prioritySchema,
    completionCriteria: z.string(),
    status: z.enum(["locked", "not_started"]),
  })),
});

export const resourceAgentOutputSchema = z.object({
  recommendations: z.array(z.object({
    skillId: z.string(),
    resourceIds: z.array(z.string()),
    reason: z.string(),
  })),
});

export const assessmentQuestionSchema = z.object({
  skillId: z.string(),
  questionText: z.string().min(1),
  difficulty: difficultySchema,
  options: z.array(z.string()).min(2).max(6),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
  concept: z.string().min(1),
}).superRefine((question, context) => {
  if (!question.options.includes(question.correctAnswer)) {
    context.addIssue({ code: "custom", path: ["correctAnswer"], message: "correctAnswer must be one of options" });
  }
});

export const assessmentAgentOutputSchema = z.object({ questions: z.array(assessmentQuestionSchema).min(1).max(20) });

export const mentorAgentOutputSchema = z.object({
  answer: z.string().min(1).max(12000),
  referencedSkills: z.array(z.string()),
  suggestedActions: z.array(z.string()),
});

export type ProfileAgentOutput = z.infer<typeof profileAgentOutputSchema>;
export type RoadmapAgentOutput = z.infer<typeof roadmapAgentOutputSchema>;
export type ResourceAgentOutput = z.infer<typeof resourceAgentOutputSchema>;
export type AssessmentAgentOutput = z.infer<typeof assessmentAgentOutputSchema>;
export type MentorAgentOutput = z.infer<typeof mentorAgentOutputSchema>;
