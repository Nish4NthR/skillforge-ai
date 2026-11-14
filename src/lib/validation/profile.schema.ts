import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  githubUsername: z.string().trim().max(39).optional().or(z.literal("")),
  hoursPerWeek: z.coerce.number().min(1).max(80),
  roleId: z.string().uuid().optional(),
  certifications: z.array(z.object({ title: z.string().min(1).max(120), issuer: z.string().min(1).max(120), year: z.coerce.number().int().min(1950).max(new Date().getFullYear()) })).default([]),
  projects: z.array(z.object({ title: z.string().min(1).max(120), description: z.string().max(1000).optional(), repoUrl: z.string().url().optional().or(z.literal("")) })).default([]),
});

export type ProfileInput = z.infer<typeof profileSchema>;
