import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/server-auth";
import {
  loadPlans,
  savePlanOverrides,
  clampCredits,
  isKnownTier,
  type PlanOverrides,
} from "@/lib/plan-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth || !auth.isAdmin) return null;
  return auth;
}

/** GET /api/admin/plans — current tier settings (fresh, uncached). */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const plans = await loadPlans(true);
  return NextResponse.json({ plans });
}

/** POST /api/admin/plans — update tier names / monthly credits. */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const tiers = body?.tiers;
  if (!tiers || typeof tiers !== "object") {
    return NextResponse.json({ error: "A `tiers` object is required." }, { status: 400 });
  }

  const clean: PlanOverrides = {};
  for (const [tier, value] of Object.entries(tiers as Record<string, any>)) {
    if (!isKnownTier(tier)) continue;
    const override: { name?: string; monthlyCredits?: number } = {};

    if (value?.name !== undefined) {
      if (typeof value.name !== "string" || !value.name.trim() || value.name.length > 40) {
        return NextResponse.json(
          { error: `Tier "${tier}" name must be 1–40 characters.` },
          { status: 400 }
        );
      }
      override.name = value.name.trim();
    }

    if (value?.monthlyCredits !== undefined) {
      const credits = Number(value.monthlyCredits);
      if (!Number.isFinite(credits) || credits < 0 || credits > 1_000_000) {
        return NextResponse.json(
          { error: `Tier "${tier}" credits must be between 0 and 1,000,000.` },
          { status: 400 }
        );
      }
      override.monthlyCredits = clampCredits(credits);
    }

    clean[tier as keyof PlanOverrides] = override;
  }

  const plans = await savePlanOverrides(clean);
  return NextResponse.json({ plans, success: true });
}
