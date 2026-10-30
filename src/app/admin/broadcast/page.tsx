"use client";

import { useEffect, useState } from "react";
import { Megaphone, Loader2, CheckCircle2, Info, AlertTriangle, Mail } from "lucide-react";
import { authFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  ANNOUNCEMENT_TONES,
  type AnnouncementTone,
} from "@/lib/announcement";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

const TONES: { value: AnnouncementTone; label: string; icon: typeof Info; color: string }[] = [
  { value: "info", label: "Info", icon: Info, color: "text-violet-500" },
  { value: "success", label: "Success", icon: CheckCircle2, color: "text-emerald-500" },
  { value: "warning", label: "Warning", icon: AlertTriangle, color: "text-amber-500" },
];

export default function BroadcastPage() {
  // ── Global announcement ────────────────────────────────────────────
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<AnnouncementTone>("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    authFetch("/api/admin/announcement")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (!active) return;
        const a = data?.announcement;
        if (a) {
          setEnabled(a.enabled === true);
          setTitle(a.title || "");
          setMessage(a.message || "");
          setTone(ANNOUNCEMENT_TONES.includes(a.tone) ? a.tone : "info");
        }
      })
      .catch(() => {
        if (active) setError("Could not load the current announcement.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    setStatus(null);
    try {
      const res = await authFetch("/api/admin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, title, message, tone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save the announcement.");
        return;
      }
      setStatus(
        enabled
          ? "Announcement published — visitors will see it on their next visit."
          : "Announcement saved and hidden from visitors."
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Email broadcast (existing feature) ─────────────────────────────
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="max-w-2xl space-y-6">
      {/* Global announcement */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/30">
              <Megaphone className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-lg font-bold leading-tight">Site Announcement</h1>
              <p className="text-xs text-muted-foreground">
                A popup shown to everyone when they open the app.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            aria-pressed={enabled}
            aria-label="Toggle announcement"
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition",
              enabled ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                enabled && "translate-x-5"
              )}
            />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="e.g. New models are live!"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="Write the details users should know…"
                className={cn(inputClass, "resize-none")}
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                {message.length}/1000
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Style</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => {
                  const Icon = t.icon;
                  const active = tone === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                        active
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", t.color)} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
            {status && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> {status}
              </div>
            )}

            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : "Save announcement"}
            </button>
          </div>
        )}
      </div>

      {/* Email broadcast (existing) */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
            <Mail className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-tight">Email Broadcast</h2>
            <p className="text-xs text-muted-foreground">
              Send an email to every registered user.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className={cn(inputClass, "resize-none")}
            />
          </div>
          <button
            onClick={() =>
              alert(
                "Connect this to a Cloud Function that sends emails to all users in the `users` collection."
              )
            }
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Send to all users
          </button>
        </div>
      </div>
    </div>
  );
}
