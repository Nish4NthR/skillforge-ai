"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Circle, Clock3, Lock, Loader2, Target } from "lucide-react";

type Resource = { id: string; title: string; url: string; provider: string; est_minutes: number };
type Step = { id: string; skill_id: string; position: number; objective: string; reason: string; estimated_minutes: number; priority: string; completion_criteria: string; status: string; skills?: { name: string }; resources?: Resource[] };
type Roadmap = { id: string; version: number; summary: string; roles?: { name: string } };

export function RoadmapClient() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/roadmap").then((response) => response.json()).then((data) => { setRoadmap(data.roadmap); setSteps(data.steps ?? []); }).catch(() => setMessage("Unable to load the roadmap.")).finally(() => setLoading(false)); }, []);
  async function startAssessment(step: Step) {
    setMessage("");
    const response = await fetch("/api/assessment/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skillId: step.skill_id, roadmapStepId: step.id, difficulty: "beginner", questionCount: 5 }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? "Unable to create assessment."); return; }
    window.location.href = `/assessment/${data.assessment.id}`;
  }
  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-violet-300" /></div>;
  const completed = steps.filter((step) => step.status === "completed").length;
  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-violet-300">Personalized learning</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Your roadmap</h1><p className="mt-3 max-w-2xl text-slate-400">{roadmap?.summary ?? "Run career analysis after onboarding to generate a roadmap from your actual gaps."}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.03] px-5 py-4 text-right"><p className="text-xs uppercase tracking-widest text-slate-500">Progress</p><p className="mt-1 text-2xl font-semibold">{completed}/{steps.length}</p></div></div>{message && <p className="mt-5 rounded-xl bg-rose-400/10 p-4 text-sm text-rose-200">{message}</p>}{!roadmap ? <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-8 text-center"><Target className="mx-auto text-violet-300" /><h2 className="mt-4 text-xl font-medium">No active roadmap yet</h2><p className="mt-2 text-sm text-slate-400">Complete onboarding and run a career analysis to create your first roadmap.</p><Link href="/onboarding" className="mt-5 inline-block rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-medium">Open onboarding</Link></div> : <div className="mt-10 space-y-4">{steps.map((step) => { const locked = step.status === "locked"; return <article key={step.id} className={`rounded-2xl border p-5 ${locked ? "border-white/5 bg-white/[.02] opacity-70" : "border-white/10 bg-white/[.03]"}`}><div className="flex items-start gap-4"><div className="mt-1 text-violet-300">{locked ? <Lock size={20} /> : step.status === "completed" ? <CheckCircle2 size={20} /> : <Circle size={20} />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><span className="text-xs uppercase tracking-widest text-slate-500">Step {step.position}</span><span className={`rounded-full px-2 py-1 text-[10px] uppercase ${step.priority === "high" ? "bg-violet-300/10 text-violet-200" : "bg-white/5 text-slate-400"}`}>{step.priority}</span><span className="flex items-center gap-1 text-xs text-slate-500"><Clock3 size={13} />{Math.round(step.estimated_minutes / 60)}h estimated</span></div><h2 className="mt-2 text-xl font-medium">{step.skills?.name ?? "Skill"}</h2><p className="mt-2 text-sm text-slate-300">{step.objective}</p><p className="mt-3 text-sm leading-6 text-slate-500">{step.reason}</p><div className="mt-4 flex flex-wrap gap-2">{(step.resources ?? []).map((resource) => <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"><BookOpen size={13} />{resource.title}</a>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Done when: {step.completion_criteria}</p><button disabled={locked || step.status === "completed"} onClick={() => startAssessment(step)} className="rounded-lg bg-violet-500 px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">{step.status === "completed" ? "Completed" : "Check understanding"}</button></div></div></div></article>; })}</div>}</div>;
}
