"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Bot, CheckCircle2, Clock3, Loader2, MessageCircle, Target } from "lucide-react";
import { getApiErrorMessage } from "@/lib/utils";

type Resource = { id: string; title: string; url: string; provider: string; est_minutes: number };
type Step = { id: string; skill_id: string; position: number; objective: string; reason: string; estimated_minutes: number; status: string; completion_criteria: string; resources?: Resource[]; skills?: { name: string } };
type Roadmap = { id: string; version: number; summary: string } | null;

export function LearningHubClient() {
  const [roadmap, setRoadmap] = useState<Roadmap>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/roadmap")
      .then((response) => response.json())
      .then((data) => { setRoadmap(data.roadmap ?? null); setSteps(data.steps ?? []); })
      .catch(() => setMessage("Unable to load the learning hub."))
      .finally(() => setLoading(false));
  }, []);

  async function startAssessment(step: Step) {
    setMessage("");
    const response = await fetch("/api/assessment/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skillId: step.skill_id, roadmapStepId: step.id, difficulty: "beginner", questionCount: 5 }) });
    const data = await response.json();
    if (!response.ok) { setMessage(getApiErrorMessage(data, "Unable to create assessment.")); return; }
    window.location.href = `/assessment/${data.assessment.id}`;
  }

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-violet-300" /></div>;
  const activeStep = steps.find((step) => ["in_progress", "needs_review", "not_started"].includes(step.status));
  const completed = steps.filter((step) => step.status === "completed").length;

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-violet-300">Focused learning workspace</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Learning hub</h1><p className="mt-3 max-w-2xl text-slate-400">Work on one evidence-backed step, use its resources, and verify understanding with an assessment.</p></div><div className="rounded-2xl border border-white/10 bg-white/[.03] px-5 py-4 text-right"><p className="text-xs uppercase tracking-widest text-slate-500">Roadmap progress</p><p className="mt-1 text-2xl font-semibold">{completed}/{steps.length}</p>{roadmap && <p className="mt-1 text-xs text-slate-500">Version {roadmap.version}</p>}</div></div>
    {message && <p className="mt-5 rounded-xl bg-rose-400/10 p-4 text-sm text-rose-200">{message}</p>}
    {!roadmap || !activeStep ? <section className="mt-10 rounded-2xl border border-dashed border-white/15 p-8 text-center"><Target className="mx-auto text-violet-300" /><h2 className="mt-4 text-xl font-medium">{roadmap ? "You have no open learning step" : "No active roadmap yet"}</h2><p className="mt-2 text-sm text-slate-400">{roadmap ? "Review your roadmap or ask the Mentor for your next challenge." : "Complete onboarding and run career analysis to create your first roadmap."}</p><div className="mt-5 flex justify-center gap-3"><Link href={roadmap ? "/roadmap" : "/onboarding"} className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-medium">{roadmap ? "Review roadmap" : "Open onboarding"}</Link><Link href="/mentor" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300">Ask Mentor</Link></div></section> : <section className="mt-10 grid gap-5 lg:grid-cols-[1.25fr_.75fr]"><article className="rounded-2xl border border-violet-300/20 bg-violet-300/5 p-6"><div className="flex items-center gap-3 text-violet-200"><BookOpen size={18} /><p className="text-xs font-semibold uppercase tracking-widest">Current learning step</p></div><h2 className="mt-4 text-3xl font-medium">{activeStep.skills?.name ?? "Skill development"}</h2><p className="mt-3 text-lg leading-7 text-slate-200">{activeStep.objective}</p><p className="mt-4 text-sm leading-6 text-slate-400">{activeStep.reason}</p><div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-400"><span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5"><Clock3 size={13} />{Math.max(1, Math.round(activeStep.estimated_minutes / 60))}h estimated</span><span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5"><Target size={13} />{activeStep.status.replaceAll("_", " ")}</span></div><div className="mt-6 rounded-xl border border-white/10 bg-black/10 p-4"><p className="text-xs uppercase tracking-widest text-slate-500">Completion criteria</p><p className="mt-2 text-sm leading-6 text-slate-300">{activeStep.completion_criteria}</p></div><button onClick={() => startAssessment(activeStep)} className="mt-6 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-950">Start assessment</button></article><aside className="space-y-5"><section className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><div className="flex items-center gap-3"><BookOpen className="text-cyan-300" size={18} /><h2 className="text-lg font-medium">Recommended resources</h2></div><div className="mt-5 space-y-3">{(activeStep.resources ?? []).length ? activeStep.resources?.map((resource) => <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/10 p-3 hover:bg-white/5"><p className="text-sm font-medium text-slate-200">{resource.title}</p><p className="mt-1 text-xs text-slate-500">{resource.provider} · {resource.est_minutes} min</p></a>) : <p className="text-sm leading-6 text-slate-500">No curated resource is attached to this step yet.</p>}</div></section><section className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><div className="flex items-center gap-3"><Bot className="text-violet-300" size={18} /><h2 className="text-lg font-medium">Need help?</h2></div><p className="mt-3 text-sm leading-6 text-slate-400">Ask the Mentor to explain this step or connect it to an assessment mistake.</p><Link href="/mentor" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300"><MessageCircle size={15} />Open Mentor</Link></section></aside></section>}
    {roadmap && <Link href="/roadmap" className="mt-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><CheckCircle2 size={15} />View the complete roadmap</Link>}
  </div>;
}
