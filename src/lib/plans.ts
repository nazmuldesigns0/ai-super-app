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

/** The three packages offered on the pricing page. */
export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceBdt: 0,
    priceLabel: "BDT 0",
    monthlyCredits: 100,
    blurb: "Free forever. Perfect for trying everything out.",
    features: [
      "100 AI credits every month",
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
    name: "Creator",
    priceBdt: 300,
    priceLabel: "BDT 300 / month",
    monthlyCredits: 1500,
    blurb: "For everyday creators, students and freelancers.",
    features: [
      "1,500 AI credits every month",
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
    name: "Studio Pro",
    priceBdt: 800,
    priceLabel: "BDT 800 / month",
    monthlyCredits: 5000,
    blurb: "Maximum power for teams and heavy daily use.",
    features: [
      "5,000 AI credits every month",
      "Everything in Creator",
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
