"use client";

import { useCallback, useState } from "react";
import { LifeBuoy, X, Send, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { HumanCheck, type HumanCheckValue } from "@/components/auth/HumanCheck";
import { inputClass } from "@/components/auth/AuthShell";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Floating support box available on every page. */
export function SupportWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [human, setHuman] = useState<HumanCheckValue>({
    token: "",
    answer: "",
    startedAt: 0,
    ready: false,
  });

  const handleHuman = useCallback((value: HumanCheckValue) => setHuman(value), []);

  const openPanel = () => {
    setOpen(true);
    setError("");
    if (!name && user?.displayName) setName(user.displayName);
    if (!email && user?.email) setEmail(user.email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          honeypot,
          token: human.token,
          answer: human.answer,
          startedAt: human.startedAt,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not send your message.");
        setResetSignal((n) => n + 1);
        return;
      }
      setSent(data.message || "Thanks! Your message has been sent.");
      setSubject("");
      setMessage("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label="Contact support"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-500/40 transition-transform hover:scale-110 animate-pulse-glow"
      >
        {open ? <X className="h-5 w-5" /> : <LifeBuoy className="h-5 w-5" />}
      </button>

      {open && (
        <div className="animate-pop-in fixed bottom-20 right-5 z-40 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 p-4 text-white">
            <p className="flex items-center gap-2 font-bold">
              <LifeBuoy className="h-4 w-4" /> Support
            </p>
            <p className="mt-0.5 text-xs opacity-90">
              We usually reply within 24 hours · {SITE.supportEmail}
            </p>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4">
            {sent ? (
              <div className="space-y-3 py-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 animate-pop-in">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground">{sent}</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSent(null);
                      setResetSignal((n) => n + 1);
                    }}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                  >
                    Send another message
                  </button>
                  <a
                    href={`mailto:${SITE.supportEmail}`}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-violet-500 hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" /> Email us directly
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <div className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>
                )}

                <input
                  type="text"
                  tabIndex={-1}
                  aria-hidden="true"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  style={{ display: "none" }}
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className={inputClass}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    required
                    className={inputClass}
                  />
                </div>

                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className={inputClass}
                />

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  rows={4}
                  maxLength={2000}
                  required
                  className={cn(inputClass, "resize-none")}
                />

                <HumanCheck onChange={handleHuman} resetSignal={resetSignal} />

                <button
                  type="submit"
                  disabled={loading || !human.ready}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {loading ? "Sending..." : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
