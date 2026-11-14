import { createClient } from "@/lib/supabase/server";
import { ZodError } from "zod";

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { supabase, user };
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  console.error("SkillForge API error", error);
  if (error instanceof ZodError) return Response.json({ error: "Invalid request." }, { status: 400 });
  if (message === "Unauthorized") return Response.json({ error: message }, { status: 401 });
  if (/not configured|required for secure server-side/i.test(message)) return Response.json({ error: message }, { status: 503 });
  return Response.json({ error: "Unable to complete that request right now." }, { status: 500 });
}
