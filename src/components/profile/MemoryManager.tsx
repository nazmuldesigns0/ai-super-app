"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { authFetch } from "@/lib/api-client";
import type { ChatSession } from "@/types";
import { Brain, Loader2, Trash2, AlertTriangle } from "lucide-react";

/**
 * Lets a user review and delete their saved conversations (the context the AI
 * remembers between requests). Deleting here removes the sessions and their
 * messages from Firestore — the assistant no longer has access to them.
 */
export default function MemoryManager() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(
        `/api/chat/sessions?userId=${encodeURIComponent(user.uid)}`
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSessions(data.sessions || []);
      } else {
        setError(data?.error || "Could not load your saved memory.");
      }
    } catch {
      setError("Could not load your saved memory.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleDelete = async (sessionId: string) => {
    if (deletingId || clearing) return;
    setDeletingId(sessionId);
    setError(null);
    try {
      const res = await authFetch(
        `/api/chat/sessions?sessionId=${encodeURIComponent(sessionId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete this conversation.");
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: any) {
      setError(err?.message || "Failed to delete this conversation.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (clearing || deletingId) return;
    const confirmed =
      typeof window !== "undefined" &&
      window.confirm(
        "Delete all saved memory? This permanently removes every saved conversation and cannot be undone."
      );
    if (!confirmed) return;

    setClearing(true);
    setError(null);
    try {
      const res = await authFetch("/api/chat/sessions?all=true", {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to clear your memory.");
      }
      setSessions([]);
    } catch (err: any) {
      setError(err?.message || "Failed to clear your memory.");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4 animate-fade-up">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Memory &amp; Chat History</h3>
            <p className="text-sm text-muted-foreground">
              Review and delete the conversations the assistant remembers.
            </p>
          </div>
        </div>
        {sessions.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            disabled={clearing || !!deletingId}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
          >
            {clearing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Clear all
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your memory…
        </div>
      ) : sessions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No saved conversations yet. Your chat history will appear here.
        </p>
      ) : (
        <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between gap-3 bg-card/40 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {session.title || "Untitled conversation"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.updatedAt
                    ? new Date(session.updatedAt).toLocaleString()
                    : "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(session.id)}
                disabled={deletingId === session.id || clearing}
                title="Delete this conversation"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                {deletingId === session.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
