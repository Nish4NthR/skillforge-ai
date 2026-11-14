import { describe, expect, it } from "vitest";
import { assessmentQuestionSchema } from "@/lib/ai/schemas";

describe("AI output contracts", () => {
  it("rejects an answer key that is not one of the options", () => {
    expect(() => assessmentQuestionSchema.parse({ skillId: "skill-1", questionText: "Question", difficulty: "beginner", options: ["A", "B"], correctAnswer: "C", explanation: "Explanation", concept: "Concept" })).toThrow();
  });

  it("accepts a structurally valid assessment question", () => {
    expect(assessmentQuestionSchema.parse({ skillId: "skill-1", questionText: "Question", difficulty: "beginner", options: ["A", "B"], correctAnswer: "A", explanation: "Explanation", concept: "Concept" }).correctAnswer).toBe("A");
  });
});
