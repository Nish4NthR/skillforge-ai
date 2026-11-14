import { NextRequest } from "next/server";
import { apiError, requireUser } from "@/lib/services";
import { profileSchema } from "@/lib/validation/profile.schema";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const [{ data: profile, error: profileError }, { data: certifications, error: certificationsError }, { data: projects, error: projectsError }, { data: goals, error: goalsError }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("certifications").select("*").eq("user_id", user.id),
      supabase.from("projects").select("*").eq("user_id", user.id),
      supabase.from("goals").select("*, roles(*)").eq("user_id", user.id).eq("active", true).maybeSingle(),
    ]);
    if (profileError || certificationsError || projectsError || goalsError) throw profileError ?? certificationsError ?? projectsError ?? goalsError;
    return Response.json({ profile, certifications: certifications ?? [], projects: projects ?? [], goal: goals });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const payload = profileSchema.parse(await request.json());
    const { certifications, projects, roleId } = payload;
    const { data: savedProfile, error: profileError } = await supabase.from("profiles").upsert({ id: user.id, full_name: payload.fullName, github_username: payload.githubUsername || null, hours_per_week: payload.hoursPerWeek }).select().single();
    if (profileError) throw profileError;
    await supabase.from("certifications").delete().eq("user_id", user.id);
    await supabase.from("projects").delete().eq("user_id", user.id);
    if (certifications.length) { const { error } = await supabase.from("certifications").insert(certifications.map((item) => ({ ...item, user_id: user.id }))); if (error) throw error; }
    if (projects.length) { const { error } = await supabase.from("projects").insert(projects.map((item) => ({ ...item, user_id: user.id, repo_url: item.repoUrl || null }))); if (error) throw error; }
    if (roleId) {
      await supabase.from("goals").update({ active: false }).eq("user_id", user.id).eq("active", true);
      const { error } = await supabase.from("goals").insert({ user_id: user.id, role_id: roleId, active: true });
      if (error) throw error;
    }
    return Response.json({ profile: savedProfile });
  } catch (error) { return apiError(error); }
}
