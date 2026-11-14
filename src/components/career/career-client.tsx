"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, Check, Loader2, Sparkles } from "lucide-react";
import { formatPercent, getApiErrorMessage } from "@/lib/utils";

type Gap = { skillName: string; gapScore: number; currentMastery: number; requiredMastery: number; priority: string; status: string };
type Analysis = { role: { id: string; name: string; description: string }; skillCoverage: number; masteredSkills: number; requiredSkills: number; gaps: Gap[] };
type Comparison = { previous?: { goal?: { roles?: { name?: string } } | null; roadmap?: { version: number; summary: string } | null }; next: { role: { name: string }; roadmap?: { summary?: string } | null } };

export function CareerClient() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [message, setMessage] = useState("");
  const [comparison, setComparison] = useState<Comparison | null>(null);

  async function loadAnalyses() {
    const response = await fetch("/api/career/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await response.json();
    if (!response.ok) throw new Error(getApiErrorMessage(data, "Unable to load career analysis."));
    setAnalyses(data.analyses ?? []);
  }

  useEffect(() => { loadAnalyses().catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load career analysis.")).finally(() => setLoading(false)); }, []);

  async function changeCareer(roleId: string) {
    setChanging(true);
    setMessage("");
    const response = await fetch("/api/career/change", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roleId }) });
    const data = await response.json();
    if (!response.ok) setMessage(getApiErrorMessage(data, "Unable to change career goal."));
    else { setMessage("Career goal changed and a new roadmap version was generated."); setComparison(data.comparison ?? null); await loadAnalyses(); }
    setChanging(false);
  }

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-violet-300" /></div>;
  const analysis = analyses[active];

  return <div>
    <div><p className="text-sm text-violet-300">Career intelligence</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Choose the direction, see the distance.</h1><p className="mt-3 max-w-2xl text-slate-400">Coverage is a transparent skill signal. It is not an employment probability.</p></div>
    {message && <p className="mt-5 rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-slate-300">{message}</p>}
    {comparison && <CareerComparison comparison={comparison} />}
    <div className="mt-10 grid gap-3 md:grid-cols-3">{analyses.map((item, index) => <button key={item.role.id} onClick={() => setActive(index)} className={`rounded-2xl border p-5 text-left ${index === active ? "border-violet-300/50 bg-violet-300/10" : "border-white/10 bg-white/[.03]"}`}><div className="flex items-center justify-between"><span className="font-medium">{item.role.name}</span><Sparkles size={16} className={index === active ? "text-violet-300" : "text-slate-600"} /></div><p className="mt-4 text-3xl font-semibold">{formatPercent(item.skillCoverage)}</p><p className="mt-1 text-xs text-slate-500">skill coverage · {item.requiredSkills} requirements</p><span className="mt-4 inline-flex items-center gap-1 text-xs text-violet-200">{index === active ? <><Check size={13} /> Inspecting</> : "Inspect role"}</span></button>)}</div>
    {analysis && <section className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><div className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><div className="flex items-center gap-3"><BriefcaseBusiness className="text-violet-300" size={18} /><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Role overview</p></div><h2 className="mt-3 text-2xl font-medium">{analysis.role.name}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{analysis.role.description}</p><div className="mt-8 h-3 rounded-full bg-white/10"><div style={{ width: `${analysis.skillCoverage * 100}%` }} className="h-3 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" /></div><div className="mt-3 flex justify-between text-xs text-slate-500"><span>{analysis.masteredSkills} mastered</span><span>{formatPercent(analysis.skillCoverage)} coverage</span></div><button disabled={changing} onClick={() => changeCareer(analysis.role.id)} className="mt-7 w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-medium disabled:opacity-50">{changing ? "Updating roadmap..." : "Set as target career"}</button></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Gap analysis</p><h2 className="mt-2 text-xl font-medium">Highest-impact skills</h2></div><span className="text-xs text-slate-500">{analysis.gaps.length} total</span></div><div className="mt-6 space-y-3">{analysis.gaps.slice(0, 8).map((gap) => <div key={gap.skillName} className="flex items-center gap-4 rounded-xl border border-white/5 bg-black/10 p-3"><div className="min-w-0 flex-1"><div className="flex justify-between gap-3 text-sm"><span className="truncate">{gap.skillName}</span><span className={`text-xs ${gap.priority === "high" ? "text-violet-300" : "text-slate-500"}`}>{gap.priority}</span></div><div className="mt-2 h-1.5 rounded-full bg-white/10"><div style={{ width: `${Math.max(4, gap.gapScore * 100)}%` }} className="h-1.5 rounded-full bg-violet-400" /></div></div><span className="text-xs text-slate-500">{formatPercent(gap.currentMastery)} → {formatPercent(gap.requiredMastery)}</span></div>)}</div></div></section>}
  </div>;
}

function CareerComparison({ comparison }: { comparison: Comparison }) {
  const previousRole = comparison.previous?.goal?.roles?.name ?? "Previous target";
  const previousRoadmap = comparison.previous?.roadmap;
  return <section className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-6"><p className="text-xs font-semibold uppercase tracking-widest text-cyan-200">Roadmap comparison</p><h2 className="mt-2 text-xl font-medium">What changed for your new direction</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-white/10 bg-black/10 p-4"><p className="text-xs uppercase tracking-widest text-slate-500">Previous</p><p className="mt-2 font-medium">{previousRole}</p><p className="mt-2 text-sm leading-6 text-slate-400">{previousRoadmap ? `Roadmap version ${previousRoadmap.version}: ${previousRoadmap.summary}` : "No previous roadmap was archived."}</p></div><div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-4"><p className="text-xs uppercase tracking-widest text-cyan-100">Now</p><p className="mt-2 font-medium">{comparison.next.role.name}</p><p className="mt-2 text-sm leading-6 text-slate-300">{comparison.next.roadmap?.summary ?? "A new roadmap was generated from your preserved mastery and the new role requirements."}</p></div></div><p className="mt-4 text-xs text-slate-500">Overlapping verified mastery and assessment history remain attached to your learner profile.</p></section>;
}
