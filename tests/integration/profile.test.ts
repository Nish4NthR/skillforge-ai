import { describe, expect, it } from "vitest";
import { profileSchema } from "@/lib/validation/profile.schema";

describe("profile integration contract", () => {
  it("accepts the profile shape sent by onboarding", () => {
    expect(profileSchema.parse({ fullName: "Ada Lovelace", hoursPerWeek: 8, roleId: "00000000-0000-4000-8000-000000000001", certifications: [], projects: [] }).fullName).toBe("Ada Lovelace");
  });
});
