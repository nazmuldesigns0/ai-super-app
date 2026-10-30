import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { isAdminEmail } from "@/lib/admin-config";
import { DEFAULT_TIER, TOP_TIER, UNLIMITED_CREDITS } from "@/lib/plans";
import { getTierCredits } from "@/lib/plan-config";
import type { SubscriptionTier, UserProfile } from "@/types";

const CREDIT_CYCLE_MS = 30 * 24 * 60 * 60 * 1000;

export interface ProvisionResult {
  profile: UserProfile | null;
  isAdmin: boolean;
  isNewUser: boolean;
  /** True when the `admin` custom claim had to be written (token refresh needed). */
  claimUpdated: boolean;
}

/**
 * Creates or updates the Firestore profile for a signed-in user and makes sure
 * admin accounts carry the `admin` custom claim.
 *
 * Admin e-mail addresses (ADMIN_EMAILS) are always placed on the most expensive
 * package with an unlimited credit balance.
 */
export async function provisionUser(params: {
  uid: string;
  email: string;
  fullName?: string | null;
  photoURL?: string | null;
  provider?: string | null;
}): Promise<ProvisionResult> {
  const db = adminDb();
  const wantsAdmin = isAdminEmail(params.email);

  if (!db) {
    return { profile: null, isAdmin: wantsAdmin, isNewUser: false, claimUpdated: false };
  }

  const ref = db.collection("users").doc(params.uid);
  const snap = await ref.get();
  const existing = snap.exists ? (snap.data() as Partial<UserProfile>) : null;
  const isNewUser = !existing;
  const now = new Date().toISOString();

  const tier: SubscriptionTier = wantsAdmin ? TOP_TIER : (existing?.subscriptionTier ?? DEFAULT_TIER);
  // New accounts are granted the tier's (admin-configurable) monthly allowance.
  const creditBalance = wantsAdmin
    ? UNLIMITED_CREDITS
    : (existing?.creditBalance ?? (await getTierCredits(tier)));

  const profile: UserProfile = {
    uid: params.uid,
    email: params.email,
    fullName: params.fullName || existing?.fullName || params.email.split("@")[0],
    photoURL: params.photoURL || existing?.photoURL || undefined,
    role: wantsAdmin ? "admin" : "user",
    creditBalance,
    creditResetAt: existing?.creditResetAt ?? new Date(Date.now() + CREDIT_CYCLE_MS).toISOString(),
    subscriptionTier: tier,
    isActive: true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await ref.set(profile, { merge: true });

  let claimUpdated = false;
  if (wantsAdmin) {
    const auth = adminAuth();
    if (auth) {
      try {
        const user = await auth.getUser(params.uid);
        if (user.customClaims?.admin !== true) {
          await auth.setCustomUserClaims(params.uid, {
            ...(user.customClaims || {}),
            admin: true,
          });
          claimUpdated = true;
        }
      } catch (err) {
        console.warn("[Provision] Could not set admin claim:", err);
      }
    }
  }

  return { profile, isAdmin: wantsAdmin, isNewUser, claimUpdated };
}
