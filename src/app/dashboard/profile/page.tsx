"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { getPlan, formatCredits, UNLIMITED_CREDITS } from "@/lib/plans";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Crown, Infinity as InfinityIcon, Mail, ShieldCheck, CalendarClock, User } from "lucide-react";

export default function ProfilePage() {
  const { profile } = useAuth();

  if (!profile) return null;

  const plan = getPlan(profile.subscriptionTier);
  const unlimited = profile.creditBalance === UNLIMITED_CREDITS;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 text-white shadow-lg shadow-violet-500/30 animate-float">
          <User className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Your <span className="gradient-text">Profile</span>
        </h1>
      </div>

      <div className="glass-panel lift rounded-2xl p-6 space-y-5 animate-fade-up">
        <div className="flex items-center gap-4">
          {profile.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoURL} alt="" className="h-16 w-16 rounded-full ring-2 ring-violet-500/40" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center text-xl font-bold shadow-lg">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{profile.fullName}</h2>
              {profile.role === "admin" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Crown className="h-3 w-3" /> Admin
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-5">
          <div>
            <p className="text-sm text-muted-foreground">Credits</p>
            <p className="text-xl font-bold">
              {unlimited ? (
                <span className="inline-flex items-center gap-1.5">
                  <InfinityIcon className="h-5 w-5 text-violet-500" /> Unlimited
                </span>
              ) : (
                formatCredits(profile.creditBalance)
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Package</p>
            <p className="flex items-center gap-2 text-xl font-bold">
              <span className={cn("h-3 w-3 rounded-full bg-gradient-to-br", plan.gradient)} />
              {plan.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="flex items-center gap-1.5 font-medium capitalize">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              {profile.role}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Next credit reset</p>
            <p className="flex items-center gap-1.5 font-medium">
              <CalendarClock className="h-4 w-4 text-violet-500" />
              {new Date(profile.creditResetAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 flex items-center gap-3 text-sm">
        <Mail className="h-5 w-5 text-violet-500" />
        <span className="text-muted-foreground">
          Need help? Contact us at{" "}
          <a href={`mailto:${SITE.supportEmail}`} className="font-semibold text-violet-500 hover:underline">
            {SITE.supportEmail}
          </a>
        </span>
      </div>
    </div>
  );
}
