"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Bot, Clock3, Loader2, Target, TrendingUp } from "lucide-react";
import { formatPercent } from "@/lib/utils";

type Gap = { skillName: string; gapScore: number; currentMastery: number; requiredMastery: number; priority: string; status: string };
type Analysis = { role: { name: string; description: string }; skillCoverage: number; masteredSkills: number; requiredSkills: number; gaps: Gap[] };
type RoadmapData = { roadmap: { summary: string; version: number } | null; steps: Array<{ id: string; skill_id: string; position: number; estimated_minutes: number; status: string; skills?: { name: string } }> };
type Assessment = { score: number | null; created_at: string; skills?: { name: string } };
type AgentRun = { status: string; created_at: string };

export function DashboardClient() {
  const [profile, setProfile] = useState<{ full_name?: string } | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [skillCount, setSkillCount] = useState(0);
  const [roadmap, setRoadmap] = useState<RoadmapData>({ roadmap: null, steps: [] });
  const [latestAssessment, setLatestAssessment] = useState<Assessment | null>(null);
  const [latestRun, setLatestRun] = useState<AgentRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((response) => response.json()),
      fetch("/api/skills").then((response) => response.json()),
      fetch("/api/career/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then((response) => response.json()),
      fetch("/api/roadmap").then((response) => response.json()),
      fetch("/api/assessment/history").then((response) => response.json()),
      fetch("/api/agents/runs").then((response) => response.json()),
    ]).then(([profileData, skillData, careerData, roadmapData, assessmentData, runData]) => {
      setProfile(profileData.profile);
      setSkillCount((skillData.learnerSkills ?? []).length);
      setAnalysis(careerData.analyses?.[0] ?? null);
      setRoadmap({ roadmap: roadmapData.roadmap ?? null, steps: roadmapData.steps ?? [] });
      setLatestAssessment(assessmentData.assessments?.[0] ?? null);
      setLatestRun(runData.runs?.[0] ?? null);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-violet-300" /></div>;
  const gaps = analysis?.gaps.filter((gap) => gap.status !== "mastered").slice(0, 4) ?? [];
  const nextStep = roadmap.steps.find((step) => step.status !== "completed");
  const completedSteps = roadmap.steps.filter((step) => step.status === "completed").length;

  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-violet-300">Good to see you again</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">{profile?.full_name ? `Welcome, ${profile.full_name.split(" ")[0]}.` : "Welcome to SkillForge."}</h1><p className="mt-3 text-slate-400">Your next move is clearer when your baseline is visible.</p></div><Link href="/career" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm hover:bg-white/5">Compare roles <ArrowRight className="ml-2 inline" size={15} /></Link></div><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Stat label="Current skill set" value={String(skillCount)} note="skills in your baseline" icon={<Target size={18} />} /><Stat label="Role readiness" value={formatPercent(analysis?.skillCoverage ?? 0)} note={analysis?.role.name ?? "Choose a target role"} icon={<TrendingUp size={18} />} /><Stat label="Roadmap progress" value={`${completedSteps}/${roadmap.steps.length}`} note={roadmap.roadmap ? `version ${roadmap.roadmap.version}` : "No roadmap yet"} icon={<Clock3 size={18} />} /><Stat label="Latest assessment" value={latestAssessment?.score == null ? "—" : formatPercent(latestAssessment.score)} note={latestAssessment?.skills?.name ?? "Not attempted"} icon={<Bot size={18} />} /></div><div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Priority gaps</p><h2 className="mt-2 text-xl font-medium">What moves the needle next</h2></div><Link href="/career" className="text-sm text-violet-300">View all</Link></div><div className="mt-7 space-y-5">{gaps.length ? gaps.map((gap) => <div key={gap.skillName}><div className="mb-2 flex justify-between text-sm"><span>{gap.skillName}</span><span className="text-slate-500">{formatPercent(gap.currentMastery)} / {formatPercent(gap.requiredMastery)}</span></div><div className="h-2 rounded-full bg-white/10"><div style={{ width: `${Math.max(6, gap.gapScore * 100)}%` }} className={`h-2 rounded-full ${gap.priority === "high" ? "bg-violet-400" : "bg-cyan-300"}`} /></div></div>) : <p className="text-sm text-slate-400">Complete onboarding to generate your first skill gaps.</p>}</div></section><section className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-400/10 to-cyan-300/5 p-6"><p className="text-xs font-semibold uppercase tracking-widest text-violet-200">Suggested next action</p><h2 className="mt-3 text-2xl font-medium">{nextStep?.skills?.name ?? (gaps[0] ? `Strengthen ${gaps[0].skillName}` : "Create your baseline")}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{nextStep ? `Continue with step ${nextStep.position}; it is estimated at ${Math.max(1, Math.round(nextStep.estimated_minutes / 60))} hours.` : gaps[0] ? "Start with the highest-impact gap in your target role, then let the graph guide the prerequisites." : "Tell us about your direction and existing skills to unlock your first analysis."}</p><Link href={nextStep ? "/roadmap" : gaps[0] ? "/skills" : "/onboarding"} className="mt-7 inline-block rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-950">{nextStep ? "Open roadmap" : gaps[0] ? "Review my skills" : "Start onboarding"} <ArrowRight className="ml-2 inline" size={15} /></Link></section></div><section className="mt-5 rounded-2xl border border-white/10 bg-white/[.03] p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Latest intelligence</p><h2 className="mt-2 text-xl font-medium">What the system did</h2></div><Link href="/activity" className="text-sm text-violet-300">Inspect activity</Link></div><p className="mt-4 text-sm text-slate-400">{latestRun ? `Your latest ${latestRun.status} agent run was recorded on ${new Date(latestRun.created_at).toLocaleString()}.` : "Run career analysis to create a persisted agent trace."}</p></section></div>;
}

function Stat({ label, value, note, icon }: { label: string; value: string; note: string; icon: React.ReactNode }) { return <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="flex items-center justify-between text-slate-500"><span className="text-sm">{label}</span><span className="text-violet-300">{icon}</span></div><p className="mt-5 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></div>; }
