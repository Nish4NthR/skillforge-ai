import { describe, expect, it } from "vitest";
import { compareCareers, matchCareer } from "@/lib/career/career-matcher";

const skills = [{ roleId: "r", skillId: "js", skill: { id: "js", name: "JavaScript", category: "Programming", description: "" }, requiredLevel: 0.8, importance: 1 }];
describe("career matcher", () => {
  it("identifies existing, partial and missing skills", () => { const result = matchCareer({ id: "r", name: "Web", description: "" }, skills, [{ userId: "u", skillId: "js", pKnown: 0.4, claimedLevel: 2, evidenceScore: .5, confidence: .5, status: "developing" }]); expect(result.gaps[0].status).toBe("partial"); expect(result.skillCoverage).toBeCloseTo(.5); });
  it("compares multiple roles by coverage", () => { const result = compareCareers([{ role: { id: "a", name: "A", description: "" }, skills }, { role: { id: "b", name: "B", description: "" }, skills: [] }], []); expect(result[0].role.id).toBe("a"); });
});
