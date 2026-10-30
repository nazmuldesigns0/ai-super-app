"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { MessageSquare, Sparkles, Image, FolderOpen } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { profile } = useAuth();

  const cards = [
    {
      title: "AI Chat Workspace",
      description: "Chat with Gemini, upload files, switch models (Arena style)",
      href: "/dashboard/chat",
      icon: MessageSquare,
    },
    {
      title: "Master Prompts",
      description: "Pre-built dynamic forms that generate powerful structured prompts",
      href: "/dashboard/master-prompts",
      icon: Sparkles,
    },
    {
      title: "Media Tools",
      description: "Background removal & image enhancement (placeholders ready)",
      href: "/dashboard/media-tools/background-removal",
      icon: Image,
    },
    {
      title: "Your Library",
      description: "All generated files. Auto-deletes after 30 days.",
      href: "/dashboard/library",
      icon: FolderOpen,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your all-in-one AI workspace. You currently have{" "}
          <span className="font-semibold text-foreground">
            {profile?.creditBalance ?? 0} credits
          </span>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{card.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
