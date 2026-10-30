"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { UNLIMITED_CREDITS, formatCredits } from "@/lib/plans";
import { usePlans } from "@/hooks/usePlans";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Check, Crown, Infinity as InfinityIcon, Sparkles, CreditCard } from "lucide-react";

export default function CreditsPage() {
  const { profile } = useAuth();
  const plans = usePlans();
  const currentTier = profile?.subscriptionTier ?? "starter";
  const unlimited = profile?.creditBalance === UNLIMITED_CREDITS;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 animate-float">
          <CreditCard className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Credits & <span className="gradient-text">Packages</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick the package that fits you. Upgrade or downgrade any time.
        </p>
      </div>

      {/* Balance card */}
      <div className="glass-panel lift rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current balance</p>
            <p className="mt-1 text-4xl font-extrabold">
              {unlimited ? (
                <span className="inline-flex items-center gap-2">
                  <InfinityIcon className="h-8 w-8 text-violet-500" />
                  Unlimited
                </span>
              ) : (
                formatCredits(profile?.creditBalance)
              )}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {unlimited
                ? "Admin account — no credit limit."
                : `Resets on ${
                    profile?.creditResetAt
                      ? new Date(profile.creditResetAt).toLocaleDateString()
                      : "—"
                  }`}
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Your package</p>
            <p className="text-lg font-bold">
              {plans.find((p) => p.id === currentTier)?.name ?? "Basic"}
            </p>
          </div>
        </div>
      </div>

      {/* Packages */}
      <div className="grid gap-5 sm:grid-cols-3">
        {plans.map((plan, index) => {
          const isCurrent = plan.id === currentTier;
          return (
            <div
              key={plan.id}
              style={{ animationDelay: `${index * 90}ms` }}
              className={cn(
                "relative rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 animate-fade-up",
                isCurrent ? "border-transparent ring-2 ring-offset-2 ring-offset-background" : "border-border"
              )}
            >
              <div className={cn("absolute inset-x-0 top-0 h-1.5 rounded-t-2xl bg-gradient-to-r", plan.gradient)} />
              {plan.popular && (
                <span className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                  <Sparkles className="h-3 w-3" /> Most popular
                </span>
              )}

              <div className={cn("mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md", plan.gradient)}>
                {plan.id === "studio" ? <Crown className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              </div>

              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="mt-1 text-2xl font-extrabold">{plan.priceLabel}</p>
              <p className="mt-2 text-xs text-muted-foreground min-h-[32px]">{plan.blurb}</p>

              <ul className="mt-5 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrent}
                className={cn(
                  "mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                  isCurrent
                    ? "cursor-default bg-secondary text-muted-foreground"
                    : cn("bg-gradient-to-r text-white shadow-lg hover:opacity-90", plan.gradient)
                )}
              >
                {isCurrent ? "Current package" : `Choose ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Need a custom or bulk package? Email us at{" "}
        <a href={`mailto:${SITE.supportEmail}`} className="font-semibold text-violet-500 hover:underline">
          {SITE.supportEmail}
        </a>
      </p>
    </div>
  );
}
