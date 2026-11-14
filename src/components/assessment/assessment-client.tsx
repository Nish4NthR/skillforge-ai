"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/utils";

type Question = { id: string; question_text: string; options: string[]; concept: string };
type Assessment = { id: string; status: string; difficulty: string; score?: number; skills?: { name: string } };
type Feedback = { questionId: string; correct: boolean; explanation: string; concept: string };
type Adaptation = { roadmapId?: string | null; explanation?: string };

export function AssessmentClient({ assessmentId }: { assessmentId: string }) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [adaptation, setAdaptation] = useState<Adaptation | null>(null);
  const [result, setResult] = useState<{ score: number; pKnown: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/assessment/${assessmentId}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.questions) throw new Error(getApiErrorMessage(data, "Assessment not found"));
        setAssessment(data.assessment);
        setQuestions(data.questions);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load assessment."))
      .finally(() => setLoading(false));
  }, [assessmentId]);

  async function submit() {
    setSubmitting(true);
    setError("");
    const response = await fetch("/api/assessment/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId, answers: questions.map((question) => ({ questionId: question.id, answer: answers[question.id] ?? "" })) }),
    });
    const data = await response.json();
    if (!response.ok) setError(getApiErrorMessage(data, "Unable to submit assessment."));
    else {
      setResult(data.mastery);
      setFeedback(data.feedback ?? []);
      setAdaptation(data.adaptation?.explanation ? data.adaptation : null);
    }
    setSubmitting(false);
  }

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-violet-300" /></div>;
  if (error && !questions.length) return <div><Link href="/roadmap" className="inline-flex items-center gap-2 text-sm text-slate-400"><ArrowLeft size={16} /> Back to roadmap</Link><p className="mt-8 rounded-xl bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p></div>;

  return <div className="mx-auto max-w-3xl">
    <Link href="/roadmap" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} /> Back to roadmap</Link>
    <p className="mt-10 text-sm text-violet-300">Assessment · {assessment?.difficulty}</p>
    <h1 className="mt-2 text-4xl font-semibold tracking-tight">Check your understanding</h1>
    <p className="mt-3 text-slate-400">Answer from your current understanding. Your result updates mastery using deterministic BKT.</p>
    {result ? <section className="mt-8 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-6">
      <CheckCircle2 className="text-emerald-300" />
      <h2 className="mt-3 text-2xl font-medium">Assessment complete</h2>
      <p className="mt-2 text-slate-300">Score: {Math.round((result.score ?? 0) * 100)}% · Updated mastery: {Math.round(result.pKnown * 100)}%</p>
      {adaptation && <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4"><p className="text-sm font-medium text-amber-100">Your roadmap was adapted</p><p className="mt-2 text-sm leading-6 text-amber-50/80">{adaptation.explanation}</p><Link href="/activity" className="mt-3 inline-block text-sm text-amber-200 underline">Inspect the adaptation trace</Link></div>}
      <div className="mt-6 space-y-3">{feedback.map((item) => <div key={item.questionId} className="rounded-xl border border-white/10 p-4"><p className={item.correct ? "text-emerald-200" : "text-rose-200"}>{item.correct ? "Correct" : "Needs review"} · {item.concept}</p><p className="mt-1 text-sm text-slate-400">{item.explanation}</p></div>)}</div>
      <Link href="/roadmap" className="mt-6 inline-block rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-950">Return to roadmap</Link>
    </section> : <div className="mt-8 space-y-5">
      {questions.map((question, index) => <fieldset key={question.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><legend className="text-xs uppercase tracking-widest text-slate-500">Question {index + 1}</legend><p className="mt-3 text-lg leading-7">{question.question_text}</p><div className="mt-5 space-y-2">{question.options.map((option) => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${answers[question.id] === option ? "border-violet-300/50 bg-violet-300/10" : "border-white/10"}`}><input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))} />{option}</label>)}</div></fieldset>)}
      {error && <p className="rounded-xl bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}
      <button disabled={submitting || questions.some((question) => !answers[question.id])} onClick={submit} className="w-full rounded-xl bg-violet-500 px-4 py-3 font-medium disabled:opacity-50">{submitting ? "Submitting..." : "Submit assessment"}</button>
    </div>}
  </div>;
}
