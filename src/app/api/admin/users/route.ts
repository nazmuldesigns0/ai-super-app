import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/server-auth";
import { adminDb } from "@/lib/firebase/admin";
import { getTierCredits, isKnownTier } from "@/lib/plan-config";
import { UNLIMITED_CREDITS } from "@/lib/plans";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CREDITS = 1_000_000;
const MAX_RESULTS = 200;

async function requireAdmin(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth || !auth.isAdmin) return null;
  return auth;
}

/** GET /api/admin/users — list user profiles (optionally filtered by `q`). */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const db = adminDb();
  if (!db) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();

  try {
    const snap = await db.collection("users").get();
    let users = snap.docs.map((doc) => ({ ...doc.data(), uid: doc.id })) as any[];

    users.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    if (q) {
      users = users.filter(
        (u) =>
          String(u.email || "").toLowerCase().includes(q) ||
          String(u.fullName || "").toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ users: users.slice(0, MAX_RESULTS), total: users.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Could not load users." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users — manually adjust a user's credits and/or package.
 *
 * Body: { uid, creditBalance?, subscriptionTier?, resetCredits? }
 * When `resetCredits` is true the balance is set to the chosen tier's monthly
 * allowance (handy when changing a package).
 */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const db = adminDb();
  if (!db) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const uid = typeof body?.uid === "string" ? body.uid.trim() : "";
  if (!uid) {
    return NextResponse.json({ error: "A user id is required." }, { status: 400 });
  }

  const tierInput = body?.subscriptionTier;
  if (tierInput !== undefined && !isKnownTier(tierInput)) {
    return NextResponse.json({ error: "Unknown subscription tier." }, { status: 400 });
  }

  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const current = snap.data() as any;
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: now };

  const previousBalance = Number(current?.creditBalance ?? 0);
  let nextBalance: number | undefined;

  if (typeof body?.creditBalance === "number") {
    const value = Number(body.creditBalance);
    if (!Number.isFinite(value) || (value < 0 && value !== UNLIMITED_CREDITS) || value > MAX_CREDITS) {
      return NextResponse.json(
        { error: `Credits must be between 0 and ${MAX_CREDITS.toLocaleString()} (or -1 for unlimited).` },
        { status: 400 }
      );
    }
    nextBalance = Math.round(value);
  }

  if (tierInput !== undefined) {
    updates.subscriptionTier = tierInput;
    if (nextBalance === undefined && body?.resetCredits === true) {
      nextBalance = await getTierCredits(tierInput);
    }
  }

  if (nextBalance !== undefined) updates.creditBalance = nextBalance;

  await ref.update(updates);

  // Log the change in the credit ledger (skip unlimited/sentinel values).
  if (nextBalance !== undefined && nextBalance !== UNLIMITED_CREDITS && previousBalance !== UNLIMITED_CREDITS) {
    const delta = nextBalance - previousBalance;
    if (delta !== 0) {
      const txRef = db.collection("creditTransactions").doc(uuidv4());
      await txRef.set({
        id: txRef.id,
        userId: uid,
        amount: delta,
        type: "admin_adjust",
        description: "Manual adjustment by admin",
        metadata: { tier: tierInput ?? current?.subscriptionTier },
        createdAt: now,
      });
    }
  }

  return NextResponse.json({
    success: true,
    user: { ...current, ...updates, uid },
  });
}
