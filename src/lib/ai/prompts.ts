export const profilePrompt = (input: unknown) => `Analyze this learner profile. Separate claimed skills from verified evidence and never infer mastery from a repository alone. Return JSON matching the supplied schema. Learner data:\n${JSON.stringify(input)}`;

export const assessmentPrompt = (skillName: string, difficulty: string, count: number) => `Create ${count} multiple-choice questions for the skill "${skillName}" at ${difficulty} difficulty. Return only JSON matching the supplied schema. Each correct answer must exactly match one option, and explanations should identify the tested concept.`;

export const mentorPrompt = (question: string, context: unknown) => `Answer the learner's question using only the supplied SkillForge context. Explain uncertainty when context is incomplete. Do not change mastery or roadmap data. Return JSON matching the supplied schema. Question: ${question}\nContext:\n${JSON.stringify(context)}`;
