"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Mail,
  RefreshCw,
  Webhook,
  XCircle,
} from "lucide-react";
import { authFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface AlertRecord {
  id: string;
  provider: string;
  model?: string;
  severity: "error" | "warning" | "recovered";
  message: string;
  statusCode?: number;
  createdAt: string;
  notified: boolean;
}

interface ProviderHealthResult {
  provider: string;
  label: string;
  model: string;
  status: "ok" | "error" | "not_configured";
  latencyMs?: number;
  message?: string;
  checkedAt: string;
}

interface Notifications {
  webhook: boolean;
  email: boolean;
  any: boolean;
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [notifications, setNotifications] = useState<Notifications | null>(null);
  const [results, setResults] = useState<ProviderHealthResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch("/api/alerts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load alerts");
      setAlerts(data.alerts || []);
      setNotifications(data.notifications || null);
    } catch (err: any) {
      setError(err.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const runHealthCheck = async () => {
    try {
      setChecking(true);
      setError(null);
      const res = await authFetch("/api/health?deep=1");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Health check failed");
      setResults(data.results || []);
      setNotifications(data.notifications || notifications);
      await loadAlerts();
    } catch (err: any) {
      setError(err.message || "Health check failed");
    } finally {
      setChecking(false);
    }
  };

  const severityStyle = (severity: AlertRecord["severity"]) =>
    severity === "error"
      ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      : severity === "warning"
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">System Health & Alerts</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Live provider monitoring. Failures are logged automatically and pushed to your
            notification channels.
          </p>
        </div>
        <button
          type="button"
          disabled={checking}
          onClick={runHealthCheck}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", checking && "animate-spin")} />
          <span>{checking ? "Probing providers..." : "Run Live Health Check"}</span>
        </button>
      </div>

      {/* Notification channels */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm">
            <Webhook className="h-4 w-4 text-primary" />
            <span>Discord / Slack Webhook</span>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold border",
              notifications?.webhook
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-muted text-muted-foreground border-border"
            )}
          >
            {notifications?.webhook ? "Connected" : "Not configured"}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-primary" />
            <span>Email (Resend)</span>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold border",
              notifications?.email
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-muted text-muted-foreground border-border"
            )}
          >
            {notifications?.email ? "Connected" : "Not configured"}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Live health results */}
      {results.length > 0 && (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/80 px-6 py-4">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Live Provider Status</h2>
          </div>
          <div className="divide-y divide-border/60">
            {results.map((r) => (
              <div
                key={r.provider}
                className="flex items-center justify-between gap-4 px-6 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.model}
                    {r.message ? ` — ${r.message}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {r.latencyMs != null && r.status === "ok" && (
                    <span className="text-xs text-muted-foreground">{r.latencyMs}ms</span>
                  )}
                  {r.status === "ok" && (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Online
                    </span>
                  )}
                  {r.status === "error" && (
                    <span className="flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
                      <XCircle className="h-3 w-3" /> Failing
                    </span>
                  )}
                  {r.status === "not_configured" && (
                    <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      No key
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent alerts */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/80 px-6 py-4">
          <BellRing className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Recent Alerts</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="font-medium text-foreground">No alerts recorded</p>
            <p className="mt-1 text-xs">All monitored providers are behaving normally.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 px-6 py-3.5">
                <AlertTriangle
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    alert.severity === "error"
                      ? "text-red-500"
                      : alert.severity === "warning"
                        ? "text-amber-500"
                        : "text-emerald-500"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{alert.provider}</span>
                    {alert.model && (
                      <span className="text-xs text-muted-foreground">{alert.model}</span>
                    )}
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                        severityStyle(alert.severity)
                      )}
                    >
                      {alert.severity}
                    </span>
                    {alert.notified && (
                      <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        notified
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground break-words">
                    {alert.message}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {new Date(alert.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
