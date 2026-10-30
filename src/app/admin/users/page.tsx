"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Search, Save, Users, Crown } from "lucide-react";
import { authFetch } from "@/lib/api-client";
import { usePlans } from "@/hooks/usePlans";
import { UNLIMITED_CREDITS, formatCredits } from "@/lib/plans";
import type { UserProfile } from "@/types";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

type Row = Pick<UserProfile, "uid" | "email" | "fullName" | "role" | "creditBalance" | "subscriptionTier">;

export default function AdminUsersPage() {
  const plans = usePlans();
  const [users, setUsers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  // Local, unsaved edits keyed by uid.
  const [edits, setEdits] = useState<Record<string, { credits: string; tier: string }>>({});

  const load = async (q = "") => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(Array.isArray(data?.users) ? data.users : []);
      setEdits({});
    } catch {
      setError("Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const editOf = (u: Row) =>
    edits[u.uid] ?? {
      credits: String(u.creditBalance ?? 0),
      tier: u.subscriptionTier ?? "starter",
    };

  const setEdit = (u: Row, patch: Partial<{ credits: string; tier: string }>) =>
    setEdits((prev) => ({ ...prev, [u.uid]: { ...editOf(u), ...patch } }));

  const saveUser = async (u: Row) => {
    const edit = editOf(u);
    setBusyId(u.uid);
    setError("");
    setStatus(null);
    try {
      const res = await authFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: u.uid,
          creditBalance: Number(edit.credits),
          subscriptionTier: edit.tier,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not update this user.");
        return;
      }
      setUsers((prev) =>
        prev.map((row) =>
          row.uid === u.uid
            ? { ...row, creditBalance: Number(edit.credits), subscriptionTier: edit.tier as any }
            : row
        )
      );
      setEdits((prev) => {
        const next = { ...prev };
        delete next[u.uid];
        return next;
      });
      setStatus(`Updated ${u.email}.`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/30">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-tight">Registered Users</h1>
          <p className="text-sm text-muted-foreground">
            Change any user&apos;s credits or package manually.
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(query.trim());
        }}
        className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email or name…"
          className="w-full bg-transparent text-sm outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg border border-border px-3 py-1 text-xs font-medium transition hover:bg-accent"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
        </div>
      ) : users.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const edit = editOf(u);
            const unlimited = u.creditBalance === UNLIMITED_CREDITS;
            const dirty =
              String(u.creditBalance ?? 0) !== edit.credits ||
              (u.subscriptionTier ?? "starter") !== edit.tier;

            return (
              <div
                key={u.uid}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-5 py-4"
              >
                <div className="min-w-[180px] flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{u.fullName || "—"}</p>
                    {u.role === "admin" && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        <Crown className="h-3 w-3" /> Admin
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Current: {formatCredits(u.creditBalance)} credits
                  </p>
                </div>

                <div className="w-36">
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                    Package
                  </label>
                  <select
                    value={edit.tier}
                    onChange={(e) => setEdit(u, { tier: e.target.value })}
                    className={inputClass}
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-32">
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                    Credits
                  </label>
                  <input
                    type="number"
                    value={edit.credits}
                    disabled={unlimited}
                    onChange={(e) => setEdit(u, { credits: e.target.value })}
                    className={cn(inputClass, unlimited && "cursor-not-allowed bg-muted")}
                  />
                </div>

                <button
                  onClick={() => saveUser(u)}
                  disabled={busyId === u.uid || !dirty}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
                    dirty
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "cursor-not-allowed bg-secondary text-muted-foreground"
                  )}
                >
                  {busyId === u.uid ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
