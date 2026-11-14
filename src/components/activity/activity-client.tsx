"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, Loader2, Network, XCircle } from "lucide-react";
import { AgentFlow } from "@/components/activity/agent-flow";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getApiErrorMessage } from "@/lib/utils";

type Run = { id: string; run_type: string; status: string; created_at: string; completed_at?: string; error_message?: string };
type AgentMessage = { id: string; sender_agent: string; receiver_agent?: string; message_type: string; payload: { explanation?: string; rationale?: string; selectedPlan?: string }; created_at: string };

export function ActivityClient() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [selected, setSelected] = useState<Run | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/agents/runs")
      .then((response) => response.json())
      .then((data) => { setRuns(data.runs ?? []); setSelected(data.runs?.[0] ?? null); })
      .catch(() => setError("Unable to load agent runs."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    fetch(`/api/agents/runs/${selected.id}/messages`)
      .then((response) => response.json())
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => setError("Unable to load the selected agent trace."));
  }, [selected]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const channel = supabase.channel("agent-activity").on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_messages" }, () => {
      if (selected) fetch(`/api/agents/runs/${selected.id}/messages`).then((response) => response.json()).then((data) => setMessages(data.messages ?? []));
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [selected]);

  async function startAnalysis() {
    setStarting(true);
    setError("");
    const response = await fetch("/api/agents/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "career_analysis" }) });
    const data = await response.json();
    if (!response.ok) setError(getApiErrorMessage(data, "Unable to start career analysis."));
    else if (data.runId) {
      const refreshed = await fetch("/api/agents/runs").then((item) => item.json());
      setRuns(refreshed.runs ?? []);
      setSelected((refreshed.runs ?? []).find((run: Run) => run.id === data.runId) ?? null);
    }
    setStarting(false);
  }

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-violet-300" /></div>;

  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-violet-300">Observable intelligence</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Agent activity</h1><p className="mt-3 max-w-2xl text-slate-400">Inspect persisted runs and the actual messages that produced your recommendations.</p></div><button onClick={startAnalysis} disabled={starting} className="rounded-xl bg-violet-500 px-4 py-3 text-sm font-medium disabled:opacity-50">{starting ? "Running agents..." : "Run career analysis"}</button></div>{error && <p className="mt-5 rounded-xl bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}{selected && <AgentFlow runType={selected.run_type} status={selected.status} />}<div className="mt-10 grid gap-5 lg:grid-cols-[.75fr_1.25fr]">{runs.length ? <aside className="space-y-2">{runs.map((run) => <button key={run.id} onClick={() => setSelected(run)} className={`w-full rounded-xl border p-4 text-left ${selected?.id === run.id ? "border-violet-300/40 bg-violet-300/10" : "border-white/10 bg-white/[.03]"}`}><div className="flex items-center justify-between"><span className="text-sm font-medium">{run.run_type.replaceAll("_", " ")}</span>{run.status === "completed" ? <CheckCircle2 className="text-emerald-300" size={16} /> : run.status === "failed" ? <XCircle className="text-rose-300" size={16} /> : <CircleDashed className="text-cyan-300" size={16} />}</div><p className="mt-2 text-xs text-slate-500">{new Date(run.created_at).toLocaleString()} · {run.status}</p></button>)}</aside> : <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">No agent runs yet. Start a career analysis to create the first persisted trace.</div>}<section className="rounded-2xl border border-white/10 bg-white/[.03] p-6">{selected ? <><div className="flex items-center gap-3"><Network className="text-violet-300" /><h2 className="text-xl font-medium">{selected.run_type.replaceAll("_", " ")}</h2><span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-400">{selected.status}</span></div><div className="mt-7 space-y-3">{messages.map((message) => <article key={message.id} className="rounded-xl border border-white/10 bg-black/10 p-4"><div className="flex items-center justify-between gap-3 text-xs"><span className="font-medium uppercase tracking-widest text-violet-200">{message.sender_agent}</span><span className="text-slate-600">{message.message_type}</span></div><p className="mt-2 text-sm leading-6 text-slate-400">{message.payload?.explanation ?? message.payload?.rationale ?? (message.payload?.selectedPlan ? `Selected plan: ${message.payload.selectedPlan}.` : `Message sent${message.receiver_agent ? ` to ${message.receiver_agent}` : ""}.`)}</p></article>)}{!messages.length && <p className="text-sm text-slate-500">No messages recorded for this run.</p>}</div></> : <div className="grid min-h-64 place-items-center text-sm text-slate-500">Select a run to inspect its trace.</div>}</section></div></div>;
}
