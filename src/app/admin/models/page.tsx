"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  X,
  Cpu,
  Search,
} from "lucide-react";
import { authFetch } from "@/lib/api-client";
import { MODEL_PROVIDERS, type ModelProvider } from "@/lib/models";
import type { StoredModel } from "@/lib/model-catalog";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

interface ModelForm {
  id: string;
  displayName: string;
  provider: ModelProvider;
  badge: string;
  cost: string;
  maxTokens: string;
  description: string;
  isPopular: boolean;
  enabled: boolean;
}

const EMPTY_FORM: ModelForm = {
  id: "",
  displayName: "",
  provider: "Google",
  badge: "",
  cost: "1",
  maxTokens: "32768",
  description: "",
  isPopular: false,
  enabled: true,
};

function toForm(model: StoredModel): ModelForm {
  return {
    id: model.id,
    displayName: model.displayName,
    provider: model.provider,
    badge: model.badge || "",
    cost: String(model.cost),
    maxTokens: String(model.maxTokens),
    description: model.description || "",
    isPopular: model.isPopular === true,
    enabled: model.enabled,
  };
}

export default function AdminModelsPage() {
  const [models, setModels] = useState<StoredModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [form, setForm] = useState<ModelForm | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [query, setQuery] = useState("");

  const load = async () => {
    try {
      const res = await authFetch("/api/admin/models");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setModels(Array.isArray(data?.models) ? data.models : []);
    } catch {
      setError("Could not load the model catalogue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q)
    );
  }, [models, query]);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM });
    setIsNew(true);
    setError("");
    setStatus(null);
  };

  const openEdit = (model: StoredModel) => {
    setForm(toForm(model));
    setIsNew(false);
    setError("");
    setStatus(null);
  };

  const closeForm = () => setForm(null);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError("");
    setStatus(null);
    try {
      const res = await authFetch("/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id.trim() || undefined,
          displayName: form.displayName,
          provider: form.provider,
          badge: form.badge,
          cost: Number(form.cost),
          maxTokens: Number(form.maxTokens),
          description: form.description,
          isPopular: form.isPopular,
          enabled: form.enabled,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save the model.");
        return;
      }
      await load();
      setForm(null);
      setStatus(isNew ? "Model added." : "Model updated.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (model: StoredModel) => {
    setBusyId(model.id);
    setError("");
    setStatus(null);
    try {
      const res = await authFetch("/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: model.id,
          displayName: model.displayName,
          provider: model.provider,
          badge: model.badge,
          cost: model.cost,
          maxTokens: model.maxTokens,
          description: model.description,
          isPopular: model.isPopular,
          enabled: !model.enabled,
        }),
      });
      if (!res.ok) throw new Error();
      setModels((prev) =>
        prev.map((m) => (m.id === model.id ? { ...m, enabled: !m.enabled } : m))
      );
      setStatus(
        `${model.displayName} ${model.enabled ? "hidden from" : "visible in"} the picker.`
      );
    } catch {
      setError("Could not update this model.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (model: StoredModel) => {
    if (!confirm(`Delete "${model.displayName}"? This cannot be undone.`)) return;
    setBusyId(model.id);
    setError("");
    setStatus(null);
    try {
      const res = await authFetch(
        `/api/admin/models?id=${encodeURIComponent(model.id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      setModels((prev) => prev.filter((m) => m.id !== model.id));
      setStatus(`${model.displayName} deleted.`);
    } catch {
      setError("Could not delete this model.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">AI Models Control</h1>
          <p className="text-sm text-muted-foreground">
            Add, edit or toggle models. Disabled models disappear from the picker instantly.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add model
        </button>
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

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search models by name, id or provider…"
          className="w-full bg-transparent text-sm outline-none"
        />
        <span className="shrink-0 text-xs text-muted-foreground">
          {filtered.length} of {models.length}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading models…
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{m.displayName}</p>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {m.provider}
                  </span>
                  {m.isCustom && (
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Custom
                    </span>
                  )}
                  {m.isPopular && (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      ★ Popular
                    </span>
                  )}
                  {!m.enabled && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {m.id} · {m.cost} credit(s) · {m.maxTokens.toLocaleString()} tokens
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => openEdit(m)}
                  aria-label={`Edit ${m.displayName}`}
                  className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {m.isCustom && (
                  <button
                    onClick={() => remove(m)}
                    disabled={busyId === m.id}
                    aria-label={`Delete ${m.displayName}`}
                    className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => toggle(m)}
                  disabled={busyId === m.id}
                  aria-pressed={m.enabled}
                  aria-label={`Toggle ${m.displayName}`}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60",
                    m.enabled ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                      m.enabled && "translate-x-5"
                    )}
                  />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No models match your search.
            </p>
          )}
        </div>
      )}

      {/* Add / Edit drawer */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
            onClick={closeForm}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-pop-in">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <p className="flex items-center gap-2 font-bold">
                <Cpu className="h-4 w-4 text-emerald-500" />
                {isNew ? "Add a model" : "Edit model"}
              </p>
              <button
                onClick={closeForm}
                aria-label="Close"
                className="rounded-lg p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Display name</label>
                <input
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  maxLength={120}
                  placeholder="e.g. Gemini 4.0 Ultra"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Model ID{" "}
                  <span className="font-normal text-muted-foreground">
                    {isNew ? "(optional — auto-generated)" : "(fixed)"}
                  </span>
                </label>
                <input
                  value={form.id}
                  readOnly={!isNew}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  placeholder="e.g. gemini-4.0-ultra"
                  className={cn(
                    inputClass,
                    !isNew && "cursor-not-allowed bg-muted text-muted-foreground"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Provider</label>
                  <select
                    value={form.provider}
                    onChange={(e) =>
                      setForm({ ...form, provider: e.target.value as ModelProvider })
                    }
                    className={inputClass}
                  >
                    {MODEL_PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Badge</label>
                  <input
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    maxLength={40}
                    placeholder="e.g. Ultra Fast"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Cost (credits)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Max tokens</label>
                  <input
                    type="number"
                    min={256}
                    max={2000000}
                    value={form.maxTokens}
                    onChange={(e) => setForm({ ...form, maxTokens: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  maxLength={300}
                  placeholder="Short description shown in the picker…"
                  className={cn(inputClass, "resize-none")}
                />
              </div>

              <div className="flex flex-wrap gap-5">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  Enabled (visible in picker)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isPopular}
                    onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  Mark as popular
                </label>
              </div>

              {error && (
                <div className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                onClick={closeForm}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving…" : isNew ? "Add model" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
