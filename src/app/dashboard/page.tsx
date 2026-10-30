"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import {
  MessageSquare,
  Sparkles,
  Image as ImageIcon,
  FolderOpen,
  Palette,
  Wand2,
  Swords,
  ArrowRight,
  Infinity as InfinityIcon,
  Crown,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { UNLIMITED_CREDITS, getPlan } from "@/lib/plans";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { profile } = useAuth();
  const unlimited = profile?.creditBalance === UNLIMITED_CREDITS;
  const plan = getPlan(profile?.subscriptionTier);

  const cards = [
    {
      title: "AI Chat Workspace",
      description: "Chat with every AI model, upload files and switch on the fly.",
      href: "/dashboard/chat",
      icon: MessageSquare,
      color: "from-fuchsia-500 to-pink-500",
    },
    {
      title: "Chat Arena",
      description: "Pit two models against each other and compare answers side by side.",
      href: "/dashboard/chat",
      icon: Swords,
      color: "from-violet-500 to-indigo-500",
    },
    {
      title: "Image Studio",
      description: "Generate stunning images from a simple text prompt.",
      href: "/dashboard/media-tools/image-studio",
      icon: Palette,
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "Master Prompts",
      description: "Ready-made dynamic forms that produce powerful structured prompts.",
      href: "/dashboard/master-prompts",
      icon: Sparkles,
      color: "from-cyan-500 to-sky-500",
    },
    {
      title: "Background Removal",
      description: "Cut out subjects and get a clean transparent background.",
      href: "/dashboard/media-tools/background-removal",
      icon: ImageIcon,
      color: "from-rose-500 to-red-500",
    },
    {
      title: "Image Enhance",
      description: "Upscale and sharpen your images in one click.",
      href: "/dashboard/media-tools/image-enhance",
      icon: Wand2,
      color: "from-purple-500 to-violet-500",
    },
    {
      title: "Your Library",
      description: "All your generated files, kept for 30 days.",
      href: "/dashboard/library",
      icon: FolderOpen,
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Credits & Packages",
      description: "See your balance and choose the package that fits you.",
      href: "/dashboard/credits",
      icon: Zap,
      color: "from-lime-500 to-green-500",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Hero */}
      <div className="aurora-field relative overflow-hidden rounded-3xl border border-border p-8 animate-fade-up">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-violet-200">
            <Sparkles className="h-3.5 w-3.5" /> {SITE.tagline}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome back
            {profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Your all-in-one AI studio. Create, chat and imagine — everything in one place.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur dark:bg-white/10">
              {unlimited ? (
                <>
                  <InfinityIcon className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                  Unlimited credits
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                  {(profile?.creditBalance ?? 0).toLocaleString()} credits
                </>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur dark:bg-white/10">
              <span className={cn("h-3 w-3 rounded-full bg-gradient-to-br", plan.gradient)} />
              {plan.name}
            </div>
            {profile?.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90"
              >
                <Crown className="h-4 w-4" /> Admin Panel
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Feature grid */}
      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="lift group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all"
            >
              <div
                className={cn(
                  "mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform group-hover:scale-110",
                  card.color
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="flex items-center gap-1.5 font-semibold">
                {card.title}
                <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
