"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Layers, Save } from "lucide-react";
import { authFetch } from "@/lib/api-client";
import type { Plan } from "@/lib/plans";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

type TierDraft = { id: string; name: string; monthlyCredits: string };

export default function AdminPlansPage() {
  const [drafts, setDrafts] = useState<TierDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    authFetch("/api/admin/plans")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (!active) return;
        const plans: Plan[] = Array.isArray(data?.plans) ? data.plans : [];
        setDrafts(
          plans.map((p) => ({
            id: p.id,
            name: p.name,
            monthlyCredits: String(p.monthlyCredits),
          }))
        );
      })
      .catch(() => {
        if (active) setError("Could not load the tier settings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = (id: string, patch: Partial<TierDraft>) =>
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const save = async () => {
    setSaving(true);
    setError("");
    setStatus(null);
    try {
      const tiers = Object.fromEntries(
        drafts.map((d) => [
          d.id,
          { name: d.name.trim(), monthlyCredits: Number(d.monthlyCredits) },
        ])
      );
      const res = await authFetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save the tier settings.");
        return;
      }
      setStatus("Tier settings saved. New sign-ups get the updated credit amounts.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-500 to-green-500 text-white shadow-lg shadow-lime-500/30">
          <Layers className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-tight">Packages &amp; Tiers</h1>
          <p className="text-sm text-muted-foreground">
            Control each tier&apos;s name and monthly credit allowance.
          </p>
        </div>
      </div>

      {(error || status) && (
        <div
          className={cn(
            "mb-4 rounded-xl px-3 py-2 text-xs",
            error
              ? "bg-destructive/10 text-destructive"
              : "flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          )}
        >
          {!error && <CheckCircle2 className="h-3.5 w-3.5" />}
          {error || status}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading tiers…
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((d, i) => (
            <div key={d.id} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tier {i + 1} · {d.id}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Display name</label>
                  <input
                    value={d.name}
                    onChange={(e) => update(d.id, { name: e.target.value })}
                    maxLength={40}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Monthly credits
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000000}
                    value={d.monthlyCredits}
                    onChange={(e) => update(d.id, { monthlyCredits: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save tiers"}
          </button>
        </div>
      )}
    </div>
  );
}
