"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Sparkles, KeyRound, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@gmail.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signInWithGoogle, signInAsDemoUser } = useAuth();
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    signInAsDemoUser();
    router.push("/dashboard");
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-md relative max-w-md mx-auto">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">AI Super Workspace</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Sign in with your Gmail account or use 1-Click Preview
        </p>
      </div>

      {/* 1-Click Demo Login Feature */}
      <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <KeyRound className="h-3.5 w-3.5" />
            <span>Instant Preview Mode</span>
          </span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
            Admin + 150 Credits
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Explore the Chat Arena, Media Tools & PDF Suite immediately without needing Firebase credentials setup.
        </p>
        <button
          type="button"
          onClick={handleDemoLogin}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.99] transition-all"
        >
          <span>⚡ One-Click Preview Login (demo@gmail.com)</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Or sign in with email
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5">Email address (must be @gmail.com)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="demo@gmail.com"
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="demo123"
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-secondary border border-border px-4 py-2.5 text-xs sm:text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 transition"
        >
          {loading ? "Signing in..." : "Sign in with Email"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-xs sm:text-sm font-medium hover:bg-accent transition disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Need to register a new account?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
