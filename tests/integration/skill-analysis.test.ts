import { describe, expect, it } from "vitest";
import { matchCareer } from "@/lib/career/career-matcher";

describe("skill analysis integration", () => {
  it("returns a stable role readiness signal from learner mastery", () => {
    const result = matchCareer({ id: "role", name: "Role", description: "" }, [{ roleId: "role", skillId: "skill", requiredLevel: .8, importance: 1, skill: { id: "skill", name: "Skill", category: "Programming", description: "" } }], [{ userId: "user", skillId: "skill", pKnown: .8, claimedLevel: 4, evidenceScore: .8, confidence: .8, status: "developing" }]);
    expect(result.skillCoverage).toBe(1);
    expect(result.gaps[0].status).toBe("mastered");
  });
});
