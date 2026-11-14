import { describe, expect, it } from "vitest";
import { isSupabaseAdminKey, isSupabasePublicKey } from "@/lib/supabase/config";

describe("Supabase credential configuration", () => {
  it("accepts current and legacy public key formats", () => {
    expect(isSupabasePublicKey("sb_publishable_example")).toBe(true);
    expect(isSupabasePublicKey("eyJhbGciOiJIUzI1NiJ9.example.signature")).toBe(true);
  });

  it("accepts current and legacy server-only key formats", () => {
    expect(isSupabaseAdminKey("sb_secret_example")).toBe(true);
    expect(isSupabaseAdminKey("eyJhbGciOiJIUzI1NiJ9.example.signature")).toBe(true);
  });

  it("rejects an unrelated API credential as a Supabase admin key", () => {
    expect(isSupabaseAdminKey("AQ.example-not-a-supabase-key")).toBe(false);
  });
});
