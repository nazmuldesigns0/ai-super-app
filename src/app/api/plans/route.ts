import { NextResponse } from "next/server";
import { loadPlans } from "@/lib/plan-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/plans — the (admin-configurable) package catalogue. */
export async function GET() {
  const plans = await loadPlans();
  return NextResponse.json(
    { plans },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
  );
}
