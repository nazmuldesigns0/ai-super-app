"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, X, Zap, Check, Crown, Rocket } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePlans } from "@/hooks/usePlans";
import { UNLIMITED_CREDITS } from "@/lib/plans";
import { cn } from "@/lib/utils";

/** Event name other components can dispatch to force the popup open. */
export const UPGRADE_EVENT = "nexora:upgrade";

/** Opens the upgrade popup from anywhere in the app. */
export function openUpgradeModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(UPGRADE_EVENT));
  }
}

const SESSION_FLAG = "nexora_upgrade_shown";

/**
 * Global subscription popup. It appears automatically once a user's credits
 * reach zero, and can be triggered manually (e.g. when an action is blocked for
 * insufficient credits) via `openUpgradeModal()`.
 */
export function UpgradeModal() {
  const { profile, loading } = useAuth();
  const plans = usePlans();
  const [open, setOpen] = useState(false);
  const balance = profile?.creditBalance;
  const unlimited = balance === UNLIMITED_CREDITS;
  const isAdmin = profile?.role === "admin";
  const prevBalance = useRef<number | null>(null);

  // Manual trigger.
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(UPGRADE_EVENT, handler);
    return () => window.removeEventListener(UPGRADE_EVENT, handler);
  }, []);

  // Auto-show when the balance drops to zero.
  useEffect(() => {
    if (loading || !profile || isAdmin || unlimited) return;
    if (typeof balance !== "number") return;

    const hitZero = balance <= 0 && (prevBalance.current === null || prevBalance.current > 0);
    prevBalance.current = balance;
    if (!hitZero) return;

    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(SESSION_FLAG) === "1";
      sessionStorage.setItem(SESSION_FLAG, "1");
    } catch {
      /* storage unavailable */
    }
    if (!alreadyShown) setOpen(true);
  }, [balance, loading, profile, isAdmin, unlimited]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade your package"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={() => setOpen(false)}
      />

      <div className="animate-pop-in relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="relative bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 p-6 text-white">
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-lg p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
            <Zap className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-xl font-extrabold">
            {unlimited ? "You're all set" : "You've run out of credits"}
          </h2>
          <p className="mt-1 text-sm text-white/85">
            {unlimited
              ? "Your account has unlimited credits."
              : "Upgrade your package to keep chatting and generating images right away."}
          </p>
        </div>

        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan, i) => {
              const Icon = i === plans.length - 1 ? Crown : i === 1 ? Rocket : Sparkles;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl border bg-background p-4",
                    plan.popular ? "border-violet-500/60 shadow-lg shadow-violet-500/10" : "border-border"
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 left-4 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      Popular
                    </span>
                  )}
                  <div
                    className={cn(
                      "mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                      plan.gradient
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="font-bold">{plan.name}</p>
                  <p className="text-lg font-extrabold">{plan.priceLabel}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.monthlyCredits.toLocaleString()} credits / month
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {plan.features.slice(1, 4).map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard/credits"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90"
            >
              View packages & upgrade
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-accent"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
