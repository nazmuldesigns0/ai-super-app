import type { SubscriptionTier } from "@/types";

/** Sentinel balance used for accounts that never run out of credits (admins). */
export const UNLIMITED_CREDITS = -1;

export interface Plan {
  id: SubscriptionTier;
  name: string;
  priceBdt: number;
  priceLabel: string;
  monthlyCredits: number;
  blurb: string;
  features: string[];
  popular?: boolean;
  /** Tailwind gradient used for the plan chip / card accent. */
  gradient: string;
  ring: string;
}

/**
 * The three packages offered on the pricing page.
 *
 * `features[0]` is always the monthly-credit line — it is regenerated from
 * `monthlyCredits` (see lib/plan-config.ts) so the admin can change the credits
 * without the text going stale.
 */
export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Basic",
    priceBdt: 0,
    priceLabel: "Free",
    monthlyCredits: 150,
    blurb: "Free forever. Perfect for trying everything out.",
    features: [
      "150 AI credits every month",
      "All free chat models",
      "Image Studio (text to image)",
      "30-day creative library",
      "Email support",
    ],
    gradient: "from-emerald-500 to-teal-500",
    ring: "ring-emerald-500/30",
  },
  {
    id: "creator",
    name: "Pro",
    priceBdt: 300,
    priceLabel: "BDT 300 / month",
    monthlyCredits: 300,
    blurb: "For everyday creators, students and freelancers.",
    features: [
      "300 AI credits every month",
      "Every chat model + Auto Smart Router",
      "Image generation and image editing",
      "Chat Arena — two models side by side",
      "Priority email support",
    ],
    popular: true,
    gradient: "from-violet-500 to-fuchsia-500",
    ring: "ring-violet-500/40",
  },
  {
    id: "studio",
    name: "Premium",
    priceBdt: 800,
    priceLabel: "BDT 800 / month",
    monthlyCredits: 500,
    blurb: "Maximum power for teams and heavy daily use.",
    features: [
      "500 AI credits every month",
      "Everything in Pro",
      "Highest quality image models",
      "Background removal & image enhancement",
      "Master Prompt library + priority support",
    ],
    gradient: "from-amber-500 via-rose-500 to-fuchsia-500",
    ring: "ring-amber-500/40",
  },
];

export const DEFAULT_TIER: SubscriptionTier = "starter";
/** The most expensive package — assigned to admin accounts automatically. */
export const TOP_TIER: SubscriptionTier = "studio";

/** All tiers, cheapest first (matches the order of PLANS). */
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = PLANS.map((p) => p.id);

export function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return typeof value === "string" && SUBSCRIPTION_TIERS.includes(value as SubscriptionTier);
}

export function getPlan(tier?: SubscriptionTier | null): Plan {
  return PLANS.find((plan) => plan.id === tier) ?? PLANS[0];
}

/** Maps legacy tier names (free / pro / enterprise) onto the new packages. */
export function normalizeTier(value: unknown): SubscriptionTier {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "creator" || normalized === "pro") return "creator";
  if (normalized === "studio" || normalized === "studio pro" || normalized === "enterprise") {
    return "studio";
  }
  return DEFAULT_TIER;
}

/** Credit cost of each billable action. */
export const CREDIT_COSTS = {
  chat: 1,
  imageGenerate: 5,
  imageEdit: 3,
} as const;

export function formatCredits(balance?: number | null): string {
  if (balance === UNLIMITED_CREDITS) return "Unlimited";
  if (typeof balance !== "number") return "0";
  return balance.toLocaleString();
}
