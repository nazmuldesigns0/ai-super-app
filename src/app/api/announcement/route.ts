import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ANNOUNCEMENT_DOC_ID, type Announcement } from "@/lib/announcement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/announcement — the site-wide notice currently shown to visitors.
 *
 * Public (no auth) because it must be able to appear as soon as someone lands
 * on the site. Returns `{ announcement: null }` when nothing is published.
 */
export async function GET() {
  const db = adminDb();
  if (!db) return NextResponse.json({ announcement: null });

  try {
    const snap = await db.collection("appSettings").doc(ANNOUNCEMENT_DOC_ID).get();
    if (!snap.exists) return NextResponse.json({ announcement: null });

    const data = snap.data() || {};
    const title = String(data.title || "").trim();
    const message = String(data.message || "").trim();

    if (data.enabled !== true || (!title && !message)) {
      return NextResponse.json({ announcement: null });
    }

    const announcement: Announcement = {
      enabled: true,
      title,
      message,
      tone: data.tone === "success" || data.tone === "warning" ? data.tone : "info",
      version: Number(data.version) || 1,
    };

    return NextResponse.json(
      { announcement },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } }
    );
  } catch (error: any) {
    console.warn("[Announcement] Could not read appSettings:", error?.message);
    return NextResponse.json({ announcement: null });
  }
}
