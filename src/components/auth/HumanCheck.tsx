"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, ShieldCheck, Loader2 } from "lucide-react";
import { inputClass } from "@/components/auth/AuthShell";

export interface HumanCheckValue {
  token: string;
  answer: string;
  startedAt: number;
  ready: boolean;
}

interface Challenge {
  token: string;
  question: string;
}

/**
 * Lightweight "are you a human?" widget. Fetches a signed arithmetic
 * challenge from the server and reports the answer upward. Paired with a
 * hidden honeypot field and a minimum fill time on the server.
 */
export function HumanCheck({
  onChange,
  resetSignal = 0,
}: {
  onChange: (value: HumanCheckValue) => void;
  resetSignal?: number;
}) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const startedAt = useRef<number>(Date.now());

  const load = useCallback(async () => {
    setChallenge(null);
    setAnswer("");
    setError("");
    startedAt.current = Date.now();
    try {
      const res = await fetch("/api/auth/challenge", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      setChallenge(await res.json());
    } catch {
      setError("Could not load the security check. Tap refresh.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, resetSignal]);

  useEffect(() => {
    onChange({
      token: challenge?.token ?? "",
      answer,
      startedAt: startedAt.current,
      ready: Boolean(challenge && answer.trim().length > 0),
    });
  }, [challenge, answer, onChange]);

  return (
    <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-300">
          <ShieldCheck className="h-3.5 w-3.5" /> Security check
        </span>
        <button
          type="button"
          onClick={() => void load()}
          title="New question"
          className="text-muted-foreground transition-colors hover:text-violet-500"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="min-w-[132px] shrink-0 rounded-lg bg-background/70 px-3 py-2 text-sm font-semibold">
          {challenge ? challenge.question : error ? "—" : <Loader2 className="h-4 w-4 animate-spin" />}
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Answer"
          className={inputClass}
          aria-label="Security check answer"
        />
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
