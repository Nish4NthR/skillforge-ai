import { describe, expect, it } from "vitest";
import { calculateGap } from "@/lib/career/gap-calculator";

describe("career gap calculator", () => {
  const roleSkills = [{ roleId: "r", skillId: "js", skill: { id: "js", name: "JavaScript", category: "Programming", description: "" }, requiredLevel: 0.8, importance: 0.5 }];
  it("returns zero when requirement is met", () => expect(calculateGap(roleSkills, [{ userId: "u", skillId: "js", pKnown: 0.9, claimedLevel: 4, evidenceScore: 1, confidence: 1, status: "mastered" }])[0].gapScore).toBe(0));
  it("weights partial gaps by importance", () => expect(calculateGap(roleSkills, [{ userId: "u", skillId: "js", pKnown: 0.2, claimedLevel: 1, evidenceScore: 0, confidence: 0, status: "developing" }])[0].gapScore).toBeCloseTo(0.3));
  it("treats missing skills as zero mastery", () => expect(calculateGap(roleSkills, [])[0].status).toBe("missing"));
  it("rejects invalid requirement inputs", () => expect(() => calculateGap([{ ...roleSkills[0], importance: 2 }], [])).toThrow());
});
