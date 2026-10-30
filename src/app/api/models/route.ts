import { NextResponse } from "next/server";
import { getEnabledModels } from "@/lib/model-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/models — the AI models currently enabled by the admin.
 *
 * Public so the model picker works for every signed-in user. Falls back to the
 * built-in catalogue when Firestore is unreachable.
 */
export async function GET() {
  try {
    const models = await getEnabledModels();
    return NextResponse.json(
      { models, count: models.length },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load models." },
      { status: 500 }
    );
  }
}
