"use client";

import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/components/providers/AuthProvider";
import { UNLIMITED_CREDITS } from "@/lib/plans";
import { SITE } from "@/lib/site";
import { Crown, Infinity as InfinityIcon, Sparkles, LifeBuoy, Zap } from "lucide-react";

export function Header() {
  const { profile } = useAuth();
  const unlimited = profile?.creditBalance === UNLIMITED_CREDITS;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border px-4 md:px-6 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="flex items-center gap-2 md:hidden font-bold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="gradient-text">{SITE.shortName}</span>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <div
          className={
            unlimited
              ? "flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-3 py-1 text-sm font-semibold text-white shadow-md"
              : "flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 px-3 py-1 text-sm ring-1 ring-violet-500/20"
          }
        >
          {unlimited ? (
            <>
              <InfinityIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Unlimited</span>
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5 text-violet-500" />
              <span className="hidden sm:inline text-muted-foreground">Credits</span>
              <span className="font-semibold">{(profile?.creditBalance ?? 0).toLocaleString()}</span>
            </>
          )}
        </div>

        <a
          href={`mailto:${SITE.supportEmail}`}
          title="Contact support"
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-violet-500 transition-colors"
        >
          <LifeBuoy className="h-4 w-4" />
        </a>

        <ThemeToggle />

        {profile && (
          <div className="flex items-center gap-2">
            {profile.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoURL}
                alt={profile.fullName}
                className="h-8 w-8 rounded-full ring-2 ring-violet-500/40"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center text-sm font-medium shadow-md">
                {profile.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-medium">{profile.fullName}</span>
              {profile.role === "admin" && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                  <Crown className="h-2.5 w-2.5" /> Admin
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
