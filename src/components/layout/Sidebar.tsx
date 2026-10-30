"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Sparkles,
  FolderOpen,
  Image,
  Wand2,
  Palette,
  CreditCard,
  User,
  LayoutDashboard,
  LogOut,
  Crown,
  LifeBuoy,
  Infinity as InfinityIcon,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { UNLIMITED_CREDITS } from "@/lib/plans";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, color: "from-violet-500 to-indigo-500" },
  { href: "/dashboard/chat", label: "AI Chat & Arena", icon: MessageSquare, color: "from-fuchsia-500 to-pink-500" },
  { href: "/dashboard/media-tools/image-studio", label: "Image Studio", icon: Palette, color: "from-amber-500 to-orange-500" },
  { href: "/dashboard/master-prompts", label: "Master Prompts", icon: Sparkles, color: "from-cyan-500 to-sky-500" },
  { href: "/dashboard/library", label: "Library (30d)", icon: FolderOpen, color: "from-emerald-500 to-teal-500" },
  {
    href: "/dashboard/media-tools/background-removal",
    label: "BG Removal",
    icon: Image,
    color: "from-rose-500 to-red-500",
  },
  {
    href: "/dashboard/media-tools/image-enhance",
    label: "Enhance",
    icon: Wand2,
    color: "from-purple-500 to-violet-500",
  },
  { href: "/dashboard/credits", label: "Credits", icon: CreditCard, color: "from-lime-500 to-green-500" },
  { href: "/dashboard/profile", label: "Profile", icon: User, color: "from-sky-500 to-blue-500" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const unlimited = profile?.creditBalance === UNLIMITED_CREDITS;

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/70 backdrop-blur">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link href="/dashboard" className="group flex items-center gap-2.5 font-bold text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-violet-500/30 transition-transform group-hover:scale-110">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="gradient-text">{SITE.name}</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-0.5"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                  isActive
                    ? "bg-white/20"
                    : cn("bg-gradient-to-br text-white opacity-90 group-hover:opacity-100", item.color)
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              {item.label}
            </Link>
          );
        })}

        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className={cn(
              "mt-4 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200",
              pathname.startsWith("/admin")
                ? "bg-gradient-to-r from-amber-400 to-rose-500 text-white shadow-lg shadow-amber-500/25"
                : "text-amber-600 hover:bg-amber-500/10"
            )}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-rose-500 text-white">
              <Crown className="h-3.5 w-3.5" />
            </span>
            Admin Panel
          </Link>
        )}
      </nav>

      <div className="border-t border-border p-4 space-y-3">
        <div className="rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Credits</p>
          <p className="flex items-center gap-1.5 text-sm font-bold">
            {unlimited ? (
              <>
                <InfinityIcon className="h-4 w-4 text-violet-500" /> Unlimited
              </>
            ) : (
              (profile?.creditBalance ?? 0).toLocaleString()
            )}
          </p>
        </div>
        <a
          href={`mailto:${SITE.supportEmail}`}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LifeBuoy className="h-4 w-4" />
          Support
        </a>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
