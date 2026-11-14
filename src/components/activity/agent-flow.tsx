import { ArrowRight, CheckCircle2, CircleDashed } from "lucide-react";

const careerFlow = ["Learner data", "Profile", "Skill gap", "Roadmap", "Resources", "Personalized plan"];
const adaptationFlow = ["Assessment", "Skill gap", "Remediation roadmap", "Resources", "Mentor explanation"];

export function AgentFlow({ runType, status }: { runType?: string; status?: string }) {
  const flow = runType === "adaptation" ? adaptationFlow : careerFlow;
  return <section className="mt-8 rounded-2xl border border-violet-300/15 bg-violet-300/5 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-violet-200">Execution flow</p><p className="mt-1 text-sm text-slate-400">A bounded trace of the selected persisted run.</p></div>{status === "completed" ? <CheckCircle2 className="text-emerald-300" size={18} /> : <CircleDashed className="text-cyan-300" size={18} />}</div><div className="mt-5 flex flex-wrap items-center gap-2">{flow.map((step, index) => <span key={step} className="inline-flex items-center gap-2"><span className="rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs text-slate-300">{step}</span>{index < flow.length - 1 && <ArrowRight className="text-slate-600" size={14} />}</span>)}</div></section>;
}
