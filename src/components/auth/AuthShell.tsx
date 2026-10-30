"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SITE } from "@/lib/site";

/**
 * Decorative shared shell for every auth screen (login, register, verify,
 * forgot password): animated aurora background, floating blobs and the brand
 * header.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="aurora-field relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="aurora-blob -left-24 -top-24 h-72 w-72 bg-violet-500/40" />
      <div className="aurora-blob -right-20 top-1/3 h-80 w-80 bg-fuchsia-500/30" />
      <div className="aurora-blob bottom-0 left-1/4 h-72 w-72 bg-cyan-400/30" />

      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-xl shadow-violet-500/30 animate-float">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-2xl font-extrabold tracking-tight gradient-text">{SITE.name}</span>
        </Link>

        <div className="glass-panel animate-fade-up rounded-3xl p-7 shadow-2xl shadow-violet-500/10">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          </div>

          {children}
        </div>

        {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Need help? <a href={`mailto:${SITE.supportEmail}`} className="font-semibold text-violet-500 hover:underline">{SITE.supportEmail}</a>
        </p>
        <nav className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link href="/privacy" className="font-semibold transition hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="font-semibold transition hover:text-foreground">
            Terms
          </Link>
        </nav>
      </div>
    </div>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="animate-fade-in rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-input bg-background/70 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20";
