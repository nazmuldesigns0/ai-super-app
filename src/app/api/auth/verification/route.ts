import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { authenticateRequest } from "@/lib/server-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { isMailerConfigured, sendMail, verificationCodeEmail } from "@/lib/mailer";

export const runtime = "nodejs";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

/** Simple in-memory guard so a user cannot spam verification e-mails. */
const lastSentAt = new Map<string, number>();

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

/**
 * E-mail verification for password sign-ups.
 *
 * POST { action: "send" }              -> e-mails a fresh 6-digit code.
 * POST { action: "verify", code }      -> marks the Firebase account verified.
 *
 * `delivered: false` means no e-mail transport is configured; the client then
 * falls back to Firebase's own free verification e-mail.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth || !auth.email) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  if (action === "send") {
    // Bounds e-mail abuse (a runaway client or script cannot spam codes).
    const limited = enforceRateLimit(req, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
      userId: auth.userId,
      message: "Too many verification e-mails requested. Please wait a few minutes.",
    });
    if (limited) return limited;

    const now = Date.now();
    const previous = lastSentAt.get(auth.userId) || 0;
    if (now - previous < RESEND_COOLDOWN_MS) {
      return NextResponse.json(
        { error: `Please wait ${Math.ceil((RESEND_COOLDOWN_MS - (now - previous)) / 1000)}s before requesting a new code.` },
        { status: 429 }
      );
    }

    const code = generateCode();
    const db = adminDb();
    if (db) {
      await db.collection("verificationCodes").doc(auth.userId).set({
        uid: auth.userId,
        email: auth.email,
        codeHash: hashCode(code),
        attempts: 0,
        expiresAt: new Date(now + CODE_TTL_MS).toISOString(),
        createdAt: new Date(now).toISOString(),
      });
    }

    if (!isMailerConfigured()) {
      return NextResponse.json({
        delivered: false,
        fallback: "firebase",
        message: "No e-mail transport configured — using Firebase verification instead.",
      });
    }

    const delivered = await sendMail({ to: auth.email, ...verificationCodeEmail(code) });
    if (!delivered) {
      return NextResponse.json(
        { error: "We could not send the verification e-mail. Please try again." },
        { status: 502 }
      );
    }

    lastSentAt.set(auth.userId, now);
    return NextResponse.json({ delivered: true, expiresInSeconds: CODE_TTL_MS / 1000 });
  }

  if (action === "verify") {
    const code = String(body?.code || "").trim();
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
    }

    const db = adminDb();
    if (!db) {
      return NextResponse.json({ error: "Verification is unavailable." }, { status: 503 });
    }

    const ref = db.collection("verificationCodes").doc(auth.userId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Request a new code and try again." }, { status: 400 });
    }

    const record = snap.data() as {
      codeHash: string;
      attempts: number;
      expiresAt: string;
    };

    if (Date.now() > new Date(record.expiresAt).getTime()) {
      await ref.delete();
      return NextResponse.json({ error: "That code has expired. Please request a new one." }, { status: 400 });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await ref.delete();
      return NextResponse.json({ error: "Too many attempts. Please request a new code." }, { status: 429 });
    }

    if (hashCode(code) !== record.codeHash) {
      await ref.update({ attempts: (record.attempts || 0) + 1 });
      return NextResponse.json({ error: "Incorrect code. Please check and try again." }, { status: 400 });
    }

    const firebaseAuth = adminAuth();
    if (firebaseAuth) {
      try {
        await firebaseAuth.updateUser(auth.userId, { emailVerified: true });
      } catch (err) {
        console.warn("[Verify] Could not mark e-mail verified:", err);
        return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
      }
    }

    await ref.delete();
    return NextResponse.json({ verified: true });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
