import { z } from "zod";

export const assessmentGenerateSchema = z.object({
  skillId: z.string().uuid(),
  roadmapStepId: z.string().uuid().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  questionCount: z.coerce.number().int().min(1).max(10).default(5),
});

export const assessmentSubmitSchema = z.object({
  assessmentId: z.string().uuid(),
  answers: z.array(z.object({ questionId: z.string().uuid(), answer: z.string().min(1).max(500) })).min(1).max(20),
}).superRefine((input, context) => {
  const ids = input.answers.map((answer) => answer.questionId);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", path: ["answers"], message: "Duplicate question answers are not allowed." });
});

export const mentorMessageSchema = z.object({ question: z.string().trim().min(1).max(4000) });
