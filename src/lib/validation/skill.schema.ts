import { z } from "zod";

export const learnerSkillSchema = z.object({
  skillId: z.string().uuid(),
  claimedLevel: z.coerce.number().int().min(0).max(5),
  evidenceScore: z.coerce.number().min(0).max(1).default(0),
});

export const skillsPayloadSchema = z.object({ skills: z.array(learnerSkillSchema).max(100) });
