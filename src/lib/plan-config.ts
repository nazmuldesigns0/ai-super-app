import { adminDb } from "@/lib/firebase/admin";
import { PLANS, SUBSCRIPTION_TIERS, type Plan } from "@/lib/plans";
import type { SubscriptionTier } from "@/types";

/** Firestore document that stores the admin-editable tier settings. */
export const PLAN_CONFIG_DOC_ID = "plans";
export const PLAN_CONFIG_COLLECTION = "appSettings";

/** Max/min accepted monthly credits for a tier. */
export const MIN_TIER_CREDITS = 0;
export const MAX_TIER_CREDITS = 1_000_000;

export interface PlanOverride {
  name?: string;
  monthlyCredits?: number;
}

export type PlanOverrides = Partial<Record<SubscriptionTier, PlanOverride>>;

const CACHE_TTL_MS = 60_000;
let cache: { at: number; plans: Plan[] } | null = null;

/** Reads the stored overrides from Firestore (never throws). */
export async function readPlanOverrides(): Promise<PlanOverrides> {
  const db = adminDb();
  if (!db) return {};
  try {
    const snap = await db
      .collection(PLAN_CONFIG_COLLECTION)
      .doc(PLAN_CONFIG_DOC_ID)
      .get();
    const data = snap.data() as { tiers?: PlanOverrides } | undefined;
    return data?.tiers ?? {};
  } catch (err) {
    console.warn("[PlanConfig] Could not read plan overrides:", err);
    return {};
  }
}

/** Applies overrides onto a built-in plan, regenerating the credit feature line. */
function applyOverride(plan: Plan, override?: PlanOverride): Plan {
  if (!override) return plan;
  const name = typeof override.name === "string" && override.name.trim()
    ? override.name.trim().slice(0, 40)
    : plan.name;
  const credits =
    typeof override.monthlyCredits === "number" && Number.isFinite(override.monthlyCredits)
      ? clampCredits(override.monthlyCredits)
      : plan.monthlyCredits;

  return {
    ...plan,
    name,
    monthlyCredits: credits,
    features: [`${credits.toLocaleString()} AI credits every month`, ...plan.features.slice(1)],
  };
}

export function clampCredits(value: number): number {
  return Math.min(MAX_TIER_CREDITS, Math.max(MIN_TIER_CREDITS, Math.round(value)));
}

/**
 * Returns the full plan catalogue (built-in defaults merged with the admin's
 * saved settings). Cached briefly to avoid a Firestore read on every request.
 */
export async function loadPlans(force = false): Promise<Plan[]> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.plans;
  const overrides = await readPlanOverrides();
  const plans = PLANS.map((plan) => applyOverride(plan, overrides[plan.id]));
  cache = { at: Date.now(), plans };
  return plans;
}

/** Monthly credit allowance for a single tier (honours admin settings). */
export async function getTierCredits(tier: SubscriptionTier): Promise<number> {
  const plans = await loadPlans();
  return (plans.find((p) => p.id === tier) ?? plans[0]).monthlyCredits;
}

/** Persists admin tier settings and refreshes the cache. */
export async function savePlanOverrides(tiers: PlanOverrides): Promise<Plan[]> {
  const db = adminDb();
  if (db) {
    await db
      .collection(PLAN_CONFIG_COLLECTION)
      .doc(PLAN_CONFIG_DOC_ID)
      .set({ tiers, updatedAt: new Date().toISOString() }, { merge: true });
  }
  invalidatePlanCache();
  return loadPlans(true);
}

export function invalidatePlanCache(): void {
  cache = null;
}

/** True when `tier` is one of the supported packages. */
export function isKnownTier(tier: unknown): tier is SubscriptionTier {
  return typeof tier === "string" && SUBSCRIPTION_TIERS.includes(tier as SubscriptionTier);
}
