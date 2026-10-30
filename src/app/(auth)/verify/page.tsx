"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { AuthShell, FieldError, inputClass } from "@/components/auth/AuthShell";
import { Loader2, MailCheck, RefreshCw, ShieldCheck } from "lucide-react";

const RESEND_SECONDS = 60;

export default function VerifyPage() {
  const { user, emailVerified, loading, reloadUser, signOut } = useAuth();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const sentOnce = useRef(false);

  const sendCode = useCallback(async () => {
    if (!user) return;
    setSending(true);
    setError("");
    setInfo("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/auth/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "send" }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Could not send the verification code.");
        return;
      }

      if (data.delivered) {
        setInfo(`We emailed a 6-digit code to ${user.email}. It expires in 10 minutes.`);
      } else {
        // No mail transport configured — fall back to Firebase's free link email.
        await sendEmailVerification(user);
        setInfo(
          `We sent a verification link to ${user.email} from Firebase. Open it, then tap "I've verified".`
        );
      }
      setCooldown(RESEND_SECONDS);
    } catch (err: any) {
      setError(err?.message || "Could not send the verification code.");
    } finally {
      setSending(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && emailVerified) router.replace("/dashboard");
  }, [loading, user, emailVerified, router]);

  useEffect(() => {
    if (!loading && user && !emailVerified && !sentOnce.current) {
      sentOnce.current = true;
      void sendCode();
    }
  }, [loading, user, emailVerified, sendCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((n) => (n <= 1 ? 0 : n - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setVerifying(true);
    setError("");
    setInfo("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/auth/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "verify", code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Verification failed.");
        return;
      }
      await reloadUser();
      await auth.currentUser?.getIdToken(true);
      setInfo("Email verified! Redirecting to your dashboard...");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleCheckVerified = async () => {
    setError("");
    await reloadUser();
    if (auth.currentUser?.emailVerified) {
      router.push("/dashboard");
    } else {
      setError("We haven't seen a verified email yet. Please click the link we sent and try again.");
    }
  };

  if (loading || !user) {
    return (
      <div className="aurora-field flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={
        <>
          Enter the 6-digit code we sent to <strong className="text-foreground">{user.email}</strong>
        </>
      }
      footer={
        <button onClick={() => signOut()} className="font-medium text-violet-500 hover:underline">
          Use a different account
        </button>
      }
    >
      <FieldError>{error}</FieldError>
      {info && (
        <div className="animate-fade-in mb-3 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          {info}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium">Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            required
            className={`${inputClass} text-center text-lg font-bold tracking-[0.5em]`}
          />
        </div>

        <button
          type="submit"
          disabled={verifying || code.length !== 6}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 disabled:opacity-50"
        >
          {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {verifying ? "Verifying..." : "Verify email"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => void sendCode()}
          disabled={sending || cooldown > 0}
          className="inline-flex items-center gap-1.5 font-medium text-violet-500 hover:underline disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>

        <button
          type="button"
          onClick={() => void handleCheckVerified()}
          className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
        >
          <MailCheck className="h-3.5 w-3.5" />
          I&apos;ve verified
        </button>
      </div>

      {!isFirebaseConfigured && (
        <p className="mt-4 text-center text-xs text-destructive">Firebase is not configured.</p>
      )}
    </AuthShell>
  );
}
