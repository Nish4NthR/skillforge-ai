import { z } from "zod";

export const careerAnalyzeSchema = z.object({ roleId: z.string().uuid().optional() });
