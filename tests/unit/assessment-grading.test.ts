import { describe, expect, it } from "vitest";
import { gradeAssessment } from "@/lib/learning/assessment";

const questions = [
  { id: "q1", correctAnswer: "A", explanation: "A is correct", concept: "foundations" },
  { id: "q2", correctAnswer: "B", explanation: "B is correct", concept: "application" },
];

describe("assessment grading", () => {
  it("grades answers using server-loaded answer keys", () => {
    const result = gradeAssessment(questions, [{ questionId: "q1", answer: "A" }, { questionId: "q2", answer: "C" }]);
    expect(result.correctCount).toBe(1);
    expect(result.totalCount).toBe(2);
    expect(result.score).toBe(0.5);
    expect(result.graded[1].explanation).toBe("B is correct");
  });

  it("rejects missing, unknown, and duplicate answers", () => {
    expect(() => gradeAssessment(questions, [{ questionId: "q1", answer: "A" }])).toThrow(/exactly every/);
    expect(() => gradeAssessment(questions, [{ questionId: "q1", answer: "A" }, { questionId: "q3", answer: "B" }])).toThrow(/exactly every/);
    expect(() => gradeAssessment(questions, [{ questionId: "q1", answer: "A" }, { questionId: "q1", answer: "A" }])).toThrow(/Duplicate/);
  });
});
