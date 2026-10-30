import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/server-auth";
import { getRecentAlerts, notificationConfig } from "@/lib/monitoring";

/** GET /api/alerts — recent provider alerts for the admin dashboard. */
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const alerts = await getRecentAlerts(50);
  const errorCount = alerts.filter((a) => a.severity === "error").length;

  return NextResponse.json({
    alerts,
    summary: { total: alerts.length, errors: errorCount },
    notifications: notificationConfig,
    identity: { verified: auth.verified, isDemo: auth.isDemo },
    fetchedAt: new Date().toISOString(),
  });
}
