"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";

export default function CreditsPage() {
  const { profile } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Credits & Subscription</h1>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Current balance</p>
        <p className="text-4xl font-bold mt-1">{profile?.creditBalance ?? 0}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Resets on{" "}
          {profile?.creditResetAt
            ? new Date(profile.creditResetAt).toLocaleDateString()
            : "—"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { name: "Free", credits: 100, price: "$0" },
          { name: "Pro", credits: 1000, price: "$19/mo" },
          { name: "Enterprise", credits: 10000, price: "Custom" },
        ].map((plan) => (
          <div
            key={plan.name}
            className="rounded-xl border border-border bg-card p-5 text-center"
          >
            <h3 className="font-semibold">{plan.name}</h3>
            <p className="mt-2 text-2xl font-bold">{plan.credits}</p>
            <p className="text-sm text-muted-foreground">credits / cycle</p>
            <p className="mt-3 font-medium">{plan.price}</p>
            <button className="mt-4 w-full rounded-lg border border-border py-2 text-sm hover:bg-accent transition">
              {plan.name === "Free" ? "Current" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
