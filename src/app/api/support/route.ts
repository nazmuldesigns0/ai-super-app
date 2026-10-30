import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { adminDb } from "@/lib/firebase/admin";
import { authenticateRequest } from "@/lib/server-auth";
import { passesFillTime, verifyHumanChallenge } from "@/lib/human-check";
import {
  isMailerConfigured,
  sendMail,
  supportAckEmail,
  supportNotifyEmail,
} from "@/lib/mailer";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

const recentSubmissions = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (recentSubmissions.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  recentSubmissions.set(key, hits);
  return hits.length > RATE_LIMIT_MAX;
}

/** POST /api/support — stores a support ticket and notifies the support inbox. */
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);

  const body = await req.json().catch(() => ({}));

  // Honeypot: real users never fill this hidden field.
  if (body?.honeypot) {
    return NextResponse.json({ error: "Verification failed." }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(auth?.userId || ip)) {
    return NextResponse.json(
      { error: "Too many messages. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  if (!passesFillTime(body?.startedAt)) {
    return NextResponse.json({ error: "That was too quick — please try again." }, { status: 400 });
  }
  if (!verifyHumanChallenge(body?.token, body?.answer)) {
    return NextResponse.json({ error: "Incorrect security answer. Please try again." }, { status: 400 });
  }

  const name = String(body?.name || "").trim().slice(0, 80);
  const email = String(body?.email || auth?.email || "").trim().slice(0, 160);
  const subject = String(body?.subject || "Support request").trim().slice(0, 120);
  const message = String(body?.message || "").trim();

  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (message.length < 5) {
    return NextResponse.json({ error: "Please describe your question in a little more detail." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message is too long. Maximum ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const ticket = {
    id: uuidv4(),
    userId: auth?.userId || null,
    name,
    email,
    subject,
    message,
    status: "open" as const,
    createdAt: new Date().toISOString(),
  };

  const db = adminDb();
  if (db) {
    try {
      await db.collection("supportTickets").doc(ticket.id).set(ticket);
    } catch (err) {
      console.error("[Support] Could not store ticket:", err);
    }
  }

  if (!isMailerConfigured()) {
    return NextResponse.json({
      ok: true,
      delivered: false,
      message: `Thanks! Your message was received. You can also email us directly at ${SITE.supportEmail}.`,
    });
  }

  const delivered = await sendMail({
    to: SITE.supportEmail,
    ...supportNotifyEmail({ name, email, subject, message }),
  });

  // Best-effort acknowledgement to the user.
  void sendMail({ to: email, ...supportAckEmail(name) });

  if (!delivered) {
    return NextResponse.json({
      ok: true,
      delivered: false,
      message: `Thanks! Your message was saved. If you don't hear back, email us at ${SITE.supportEmail}.`,
    });
  }

  return NextResponse.json({
    ok: true,
    delivered: true,
    message: "Thanks! Your message has been sent to our support team.",
  });
}
