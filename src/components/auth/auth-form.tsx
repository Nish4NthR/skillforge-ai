"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (mode === "signup" && !result.data.session) {
        setMessage("Check your inbox to confirm your email, then come back to sign in.");
      } else {
        router.push("/onboarding");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to connect to Supabase.");
    } finally {
      setLoading(false);
    }
  }
  return <main className="grid min-h-screen place-items-center bg-[#080b14] px-6"><div className="w-full max-w-md"><Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} /> Back to home</Link><div className="mb-8 flex items-center gap-2 text-lg font-semibold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-500"><Sparkles size={17} /></span>SkillForge</div><div className="rounded-3xl border border-white/10 bg-white/[.04] p-7"><h1 className="text-2xl font-semibold">{mode === "login" ? "Welcome back" : "Build your skill map"}</h1><p className="mt-2 text-sm text-slate-400">{mode === "login" ? "Pick up where you left off." : "Start with a grounded view of what you know."}</p><form onSubmit={submit} className="mt-8 space-y-4"><label className="block text-sm text-slate-300">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none ring-violet-400 focus:ring-2" /></label><label className="block text-sm text-slate-300">Password<input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none ring-violet-400 focus:ring-2" /></label>{error && <p className="rounded-lg bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}{message && <p className="rounded-lg bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</p>}<button disabled={loading} className="w-full rounded-xl bg-violet-500 px-4 py-3 font-medium hover:bg-violet-400 disabled:opacity-60">{loading ? <Loader2 className="mx-auto animate-spin" size={18} /> : mode === "login" ? "Log in" : "Create account"}</button></form><p className="mt-6 text-center text-sm text-slate-400">{mode === "login" ? "New to SkillForge?" : "Already have an account?"} <Link className="text-violet-300 hover:text-violet-200" href={mode === "login" ? "/signup" : "/login"}>{mode === "login" ? "Create an account" : "Log in"}</Link></p></div></div></main>;
}
