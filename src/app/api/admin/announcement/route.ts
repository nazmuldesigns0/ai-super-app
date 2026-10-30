import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/server-auth";
import { adminDb } from "@/lib/firebase/admin";
import {
  ANNOUNCEMENT_DOC_ID,
  ANNOUNCEMENT_TONES,
  EMPTY_ANNOUNCEMENT,
  type AnnouncementTone,
} from "@/lib/announcement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin-only editor for the site-wide announcement. */

async function requireAdmin(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth || !auth.isAdmin) return null;
  return auth;
}

/** GET /api/admin/announcement — current settings, even when disabled. */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const db = adminDb();
  if (!db) return NextResponse.json({ announcement: EMPTY_ANNOUNCEMENT });

  const snap = await db.collection("appSettings").doc(ANNOUNCEMENT_DOC_ID).get();
  if (!snap.exists) return NextResponse.json({ announcement: EMPTY_ANNOUNCEMENT });

  const data = snap.data() || {};
  return NextResponse.json({
    announcement: {
      enabled: data.enabled === true,
      title: String(data.title || ""),
      message: String(data.message || ""),
      tone: data.tone === "success" || data.tone === "warning" ? data.tone : "info",
      version: Number(data.version) || 1,
      updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined,
    },
  });
}

/** POST /api/admin/announcement — save the announcement. */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const db = adminDb();
  if (!db) {
    return NextResponse.json({ error: "Admin database is unavailable." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const enabled = body?.enabled === true;
  const title = String(body?.title || "").trim();
  const message = String(body?.message || "").trim();
  const tone: AnnouncementTone = ANNOUNCEMENT_TONES.includes(body?.tone) ? body.tone : "info";

  if (title.length > 120) {
    return NextResponse.json({ error: "Title is too long (max 120 characters)." }, { status: 400 });
  }
  if (message.length > 1000) {
    return NextResponse.json(
      { error: "Message is too long (max 1000 characters)." },
      { status: 400 }
    );
  }
  if (enabled && !title && !message) {
    return NextResponse.json(
      { error: "Add a title or a message before enabling the announcement." },
      { status: 400 }
    );
  }

  const ref = db.collection("appSettings").doc(ANNOUNCEMENT_DOC_ID);
  const snap = await ref.get();
  const previous = snap.exists ? snap.data() || {} : {};

  // Only bump the version when the wording changes, so merely toggling the
  // announcement off/on does not re-show it to everyone.
  const contentChanged =
    String(previous.title || "") !== title ||
    String(previous.message || "") !== message ||
    (previous.tone || "info") !== tone;

  const version = contentChanged ? Date.now() : Number(previous.version) || 1;
  const now = new Date().toISOString();

  try {
    await ref.set(
      { enabled, title, message, tone, version, updatedAt: now },
      { merge: true }
    );
    return NextResponse.json({ success: true, announcement: { enabled, title, message, tone, version, updatedAt: now } });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not save the announcement." },
      { status: 500 }
    );
  }
}
