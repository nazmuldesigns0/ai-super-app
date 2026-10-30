"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { AuthShell, FieldError, inputClass } from "@/components/auth/AuthShell";
import { HumanCheck, type HumanCheckValue } from "@/components/auth/HumanCheck";
import { Loader2, Mail, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [human, setHuman] = useState<HumanCheckValue>({
    token: "",
    answer: "",
    startedAt: 0,
    ready: false,
  });
  const [resetSignal, setResetSignal] = useState(0);

  const { sendPasswordReset } = useAuth();

  const handleHuman = useCallback((value: HumanCheckValue) => setHuman(value), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/human-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(human),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Security check failed.");
      }
      await sendPasswordReset(email);
      setSent(true);
    } catch (err: any) {
      const code = err?.code || "";
      if (code.includes("user-not-found")) {
        // Don't reveal whether the address exists — treat it as sent.
        setSent(true);
      } else {
        setError(err?.message || "Could not send the reset email.");
        setResetSignal((n) => n + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure link to choose a new password."
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-violet-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="animate-fade-up space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 animate-pop-in">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            If an account exists for <strong className="text-foreground">{email}</strong>, a password reset link is on
            its way. Check your inbox (and spam folder).
          </p>
          <Link
            href="/login"
            className="inline-block rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:opacity-90"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <FieldError>{error}</FieldError>

          <div className="mb-5 flex items-center gap-3 rounded-xl bg-violet-500/10 p-3.5 text-xs text-muted-foreground">
            <KeyRound className="h-4 w-4 shrink-0 text-violet-500" />
            Enter the email you registered with and we&apos;ll send a reset link.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  required
                  autoComplete="email"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <HumanCheck onChange={handleHuman} resetSignal={resetSignal} />

            <button
              type="submit"
              disabled={loading || !human.ready}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Sending link..." : "Send reset link"}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
