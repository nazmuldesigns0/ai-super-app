"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { AuthShell, FieldError, inputClass } from "@/components/auth/AuthShell";
import { HumanCheck, type HumanCheckValue } from "@/components/auth/HumanCheck";
import { GoogleButton, Divider } from "@/components/auth/GoogleButton";
import { Loader2, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [human, setHuman] = useState<HumanCheckValue>({
    token: "",
    answer: "",
    startedAt: 0,
    ready: false,
  });
  const [resetSignal, setResetSignal] = useState(0);

  const { signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleHuman = useCallback((value: HumanCheckValue) => setHuman(value), []);

  const verifyHuman = async () => {
    const res = await fetch("/api/auth/human-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(human),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Security check failed.");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyHuman();
      await signInWithEmail(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(friendlyAuthError(err));
      setResetSignal((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your AI studio — chat, generate and create."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-semibold text-violet-500 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <FieldError>{error}</FieldError>

      <form onSubmit={handleEmailLogin} className="space-y-4">
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

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-xs font-medium">Password</label>
            <Link href="/forgot-password" className="text-xs font-medium text-violet-500 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <HumanCheck onChange={handleHuman} resetSignal={resetSignal} />

        <button
          type="submit"
          disabled={loading || googleLoading || !human.ready}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <Divider />

      <GoogleButton onClick={handleGoogle} loading={googleLoading} disabled={loading} />

      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
        Google sign-in skips email verification. Email sign-in requires a verified @gmail.com address.
      </p>
    </AuthShell>
  );
}

function friendlyAuthError(err: any): string {
  const code = err?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Incorrect email or password.";
  }
  if (code.includes("too-many-requests")) return "Too many attempts. Please try again later.";
  if (code.includes("invalid-email")) return "Please enter a valid email address.";
  if (code.includes("network-request-failed")) return "Network error. Please check your connection.";
  return err?.message || "Failed to sign in.";
}
