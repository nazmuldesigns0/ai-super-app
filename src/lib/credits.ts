import type { Firestore } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import { UNLIMITED_CREDITS } from "@/lib/plans";
import type { CreditTransaction } from "@/types";

export interface ChargeResult {
  ok: boolean;
  /** Balance after the charge (or the current balance when the charge failed). */
  balance: number;
  /** True for admins / unlimited accounts (no credits were taken). */
  unlimited?: boolean;
}

/**
 * Reads a user's credit balance. Returns `null` when the Admin SDK is not
 * configured or the document does not exist (callers should then skip checks).
 */
export async function getCreditBalance(
  db: Firestore | null,
  userId?: string
): Promise<number | null> {
  if (!db || !userId) return null;
  try {
    const snap = await db.collection("users").doc(userId).get();
    if (!snap.exists) return null;
    return Number(snap.data()?.creditBalance ?? 0);
  } catch (err) {
    console.warn("[Credits] Could not read balance:", err);
    return null;
  }
}

/**
 * Atomically deducts `cost` credits and records a transaction.
 *
 * A Firestore transaction is used so concurrent requests can never overspend or
 * overwrite each other's balance — the balance stays perfectly in sync.
 */
export async function chargeCredits(opts: {
  db: Firestore | null;
  userId?: string;
  cost: number;
  type?: CreditTransaction["type"];
  description?: string;
  metadata?: Record<string, unknown>;
  /** Admins never have credits deducted. */
  isAdmin?: boolean;
}): Promise<ChargeResult> {
  const { db, userId, cost, type = "usage", description, metadata, isAdmin } = opts;
  if (!db || !userId || cost <= 0) return { ok: true, balance: 0 };

  const userRef = db.collection("users").doc(userId);
  const now = new Date().toISOString();

  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) return { ok: false, balance: 0 };

      const current = Number(snap.data()?.creditBalance ?? 0);
      if (isAdmin || current === UNLIMITED_CREDITS) {
        return { ok: true, balance: UNLIMITED_CREDITS, unlimited: true };
      }
      if (current < cost) return { ok: false, balance: current };

      const next = current - cost;
      tx.update(userRef, { creditBalance: next, updatedAt: now });

      const txRef = db.collection("creditTransactions").doc(uuidv4());
      tx.set(txRef, {
        id: txRef.id,
        userId,
        amount: -cost,
        type,
        description: description || "",
        metadata: metadata || {},
        createdAt: now,
      });

      return { ok: true, balance: next };
    });
  } catch (err) {
    console.error("[Credits] Deduction failed:", err);
    return { ok: false, balance: 0 };
  }
}
