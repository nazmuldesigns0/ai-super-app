import { adminDb } from "@/lib/firebase/admin";
import { generateContentUniversal, sanitizeErrorMessage } from "@/lib/gemini";

// ── Alert model ──────────────────────────────────────────────────────────────
export type AlertSeverity = "error" | "warning" | "recovered";

export interface AlertRecord {
  id: string;
  provider: string;
  model?: string;
  severity: AlertSeverity;
  message: string;
  statusCode?: number;
  userId?: string;
  createdAt: string;
  notified: boolean;
}

export interface ReportAlertInput {
  provider: string;
  model?: string;
  message: string;
  severity?: AlertSeverity;
  statusCode?: number;
  userId?: string;
}

/** Notifications for the same provider/model are throttled to avoid spam. */
const ALERT_THROTTLE_MS = Number(process.env.ALERT_THROTTLE_MS || 5 * 60 * 1000);
const lastAlertAt = new Map<string, number>();

/** How many alerts to keep in memory when Firestore is not available. */
const MAX_IN_MEMORY_ALERTS = 50;
const memoryAlerts: AlertRecord[] = [];

/** Notification channel configuration. */
export const notificationConfig = {
  webhook: Boolean(process.env.ALERT_WEBHOOK_URL),
  email: Boolean(process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO),
  get any() {
    return this.webhook || this.email;
  },
};

function buildAlertMessage(input: ReportAlertInput): string {
  const scope = input.model ? `${input.provider} · ${input.model}` : input.provider;
  const code = input.statusCode ? ` (HTTP ${input.statusCode})` : "";
  return `[${input.severity || "error"}] ${scope}${code}: ${sanitizeErrorMessage(
    input.message
  )}`;
}

/**
 * Records an alert to Firestore and pushes it to every configured notification
 * channel. Never throws — monitoring must not break the request path.
 */
export async function reportAlert(input: ReportAlertInput): Promise<AlertRecord | null> {
  const severity = input.severity || "error";
  const throttleKey = `${input.provider}:${input.model || "*"}:${severity}`;
  const now = Date.now();

  const record: AlertRecord = {
    id: `alert_${now}_${Math.random().toString(36).slice(2, 8)}`,
    provider: input.provider,
    model: input.model,
    severity,
    message: sanitizeErrorMessage(input.message),
    statusCode: input.statusCode,
    userId: input.userId,
    createdAt: new Date(now).toISOString(),
    notified: false,
  };

  // Always surface in the server logs.
  console.warn(`[AI Monitor] ${buildAlertMessage(input)}`);

  const shouldNotify =
    severity === "recovered" || now - (lastAlertAt.get(throttleKey) || 0) > ALERT_THROTTLE_MS;

  if (shouldNotify) {
    lastAlertAt.set(throttleKey, now);
    // Always keep a recent copy in memory so the admin dashboard and
    // /api/alerts still surface failures when the Admin SDK is not configured.
    memoryAlerts.unshift(record);
    if (memoryAlerts.length > MAX_IN_MEMORY_ALERTS) {
      memoryAlerts.length = MAX_IN_MEMORY_ALERTS;
    }
  }

  try {
    record.notified = shouldNotify && (await dispatchNotifications(record));
  } catch (err) {
    console.error("[AI Monitor] Notification dispatch failed:", err);
  }

  // Persist (throttled) so the admin dashboard stays readable.
  try {
    const db = adminDb();
    if (db && shouldNotify) {
      await db.collection("systemAlerts").doc(record.id).set(record);
    }
  } catch (err) {
    console.error("[AI Monitor] Failed to persist alert:", err);
  }

  return record;
}

/** Convenience wrapper for provider call failures. */
export function reportProviderFailure(
  provider: string,
  model: string | undefined,
  error: unknown,
  userId?: string
): void {
  const message = error instanceof Error ? error.message : String(error);
  const statusCode = (error as { statusCode?: number })?.statusCode;
  // Fire-and-forget: callers should not await monitoring.
  void reportAlert({ provider, model, message, statusCode, userId, severity: "error" });
}

async function dispatchNotifications(record: AlertRecord): Promise<boolean> {
  let delivered = false;
  const title =
    record.severity === "recovered"
      ? "AI Provider Recovered"
      : record.severity === "warning"
        ? "AI Provider Warning"
        : "AI Provider Failure";
  const text = `${title}\n${record.provider}${record.model ? ` · ${record.model}` : ""}\n${
    record.message
  }`;

  if (process.env.ALERT_WEBHOOK_URL) {
    try {
      // `content` is read by Discord, `text` by Slack — safe to send both.
      const res = await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, text, username: "AI Super App Monitor" }),
      });
      delivered = res.ok || delivered;
    } catch (err) {
      console.error("[AI Monitor] Webhook failed:", err);
    }
  }

  if (process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.ALERT_EMAIL_FROM || "AI Monitor <onboarding@resend.dev>",
          to: [process.env.ALERT_EMAIL_TO],
          subject: `[${record.severity}] ${title}: ${record.provider}`,
          text,
        }),
      });
      delivered = res.ok || delivered;
    } catch (err) {
      console.error("[AI Monitor] Email failed:", err);
    }
  }

  return delivered;
}

// ── Provider health checks ───────────────────────────────────────────────────
export interface ProviderCheck {
  provider: string;
  label: string;
  model: string;
  envVar: string;
}

/**
 * Cheap, representative model per provider used for liveness probing.
 * Only free/verified providers are probed; paid providers are left out until a
 * working key is added so the dashboard never shows misleading failures.
 */
export const PROVIDER_CHECKS: ProviderCheck[] = [
  { provider: "Google", label: "Google Gemini", model: "gemini-3.5-flash-lite", envVar: "GEMINI_API_KEY" },
  { provider: "Groq", label: "Groq Cloud", model: "openai/gpt-oss-20b", envVar: "GROQ_API_KEY" },
  { provider: "Mistral", label: "Mistral AI", model: "ministral-8b-latest", envVar: "MISTRAL_API_KEY" },
  { provider: "Cloudflare", label: "Cloudflare Workers AI", model: "@cf/meta/llama-3.1-8b-instruct", envVar: "CLOUDFLARE_API_TOKEN" },
];

export interface ProviderHealthResult {
  provider: string;
  label: string;
  model: string;
  status: "ok" | "error" | "not_configured";
  latencyMs?: number;
  message?: string;
  checkedAt: string;
}

/**
 * Sends a tiny live request to every configured provider and reports which
 * ones respond. Failures are logged as alerts (and notified once).
 */
export async function runProviderHealthCheck(): Promise<ProviderHealthResult[]> {
  const checkedAt = new Date().toISOString();

  const results = await Promise.all(
    PROVIDER_CHECKS.map(async (check): Promise<ProviderHealthResult> => {
      if (!process.env[check.envVar] || !process.env[check.envVar]!.trim()) {
        return {
          provider: check.provider,
          label: check.label,
          model: check.model,
          status: "not_configured",
          message: `${check.envVar} is not set.`,
          checkedAt,
        };
      }

      const started = Date.now();
      try {
        await generateContentUniversal({
          model: check.model,
          prompt: "Reply with the single word: ok",
          systemInstruction: "You are a health probe. Reply with 'ok'.",
        });
        return {
          provider: check.provider,
          label: check.label,
          model: check.model,
          status: "ok",
          latencyMs: Date.now() - started,
          checkedAt,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        void reportAlert({
          provider: check.provider,
          model: check.model,
          message: `Health check failed: ${message}`,
          severity: "error",
        });
        return {
          provider: check.provider,
          label: check.label,
          model: check.model,
          status: "error",
          latencyMs: Date.now() - started,
          message: sanitizeErrorMessage(message),
          checkedAt,
        };
      }
    })
  );

  return results;
}

/** Recent alerts for the admin dashboard (newest first). */
export async function getRecentAlerts(limit = 50): Promise<AlertRecord[]> {
  try {
    const db = adminDb();
    if (!db) return memoryAlerts.slice(0, limit);
    const snap = await db
      .collection("systemAlerts")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    const persisted = snap.docs.map((doc) => doc.data() as AlertRecord);
    // Merge in-memory alerts (e.g. recorded before the Admin SDK was ready).
    const byId = new Map<string, AlertRecord>();
    for (const a of [...memoryAlerts, ...persisted]) byId.set(a.id, a);
    return Array.from(byId.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  } catch (err) {
    console.error("[AI Monitor] Could not load alerts:", err);
    return memoryAlerts.slice(0, limit);
  }
}
