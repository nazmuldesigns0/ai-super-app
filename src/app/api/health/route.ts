import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/server-auth";
import {
  notificationConfig,
  PROVIDER_CHECKS,
  runProviderHealthCheck,
} from "@/lib/monitoring";

/**
 * GET /api/health            -> configuration status of every provider.
 * GET /api/health?deep=1     -> live probe of every configured provider
 *                               (admin only; each probe makes a real AI call).
 */
export async function GET(req: NextRequest) {
  const deep = new URL(req.url).searchParams.get("deep") === "1";
  const checkedAt = new Date().toISOString();

  if (deep) {
    const auth = await authenticateRequest(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const results = await runProviderHealthCheck();
    const healthy = results.filter((r) => r.status === "ok").length;
    const errored = results.filter((r) => r.status === "error").length;
    const notConfigured = results.filter((r) => r.status === "not_configured").length;

    return NextResponse.json({
      status: errored > 0 ? "degraded" : "ok",
      checkedAt,
      summary: { healthy, errored, notConfigured, total: results.length },
      results,
      notifications: notificationConfig,
    });
  }

  // Shallow mode: report which providers are configured (no calls made).
  const providers = PROVIDER_CHECKS.map((check) => ({
    provider: check.provider,
    label: check.label,
    model: check.model,
    envVar: check.envVar,
    configured: Boolean(process.env[check.envVar]?.trim()),
  }));

  return NextResponse.json({
    status: "ok",
    checkedAt,
    providers,
    notifications: notificationConfig,
  });
}
