"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  BarChart3,
  Cpu,
  Layers,
  Activity,
  Megaphone,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, color: "from-violet-500 to-indigo-500" },
  { href: "/admin/users", label: "Users", icon: Users, color: "from-fuchsia-500 to-pink-500" },
  { href: "/admin/plans", label: "Plans", icon: Layers, color: "from-lime-500 to-green-500" },
  { href: "/admin/usage", label: "Usage", icon: BarChart3, color: "from-cyan-500 to-sky-500" },
  { href: "/admin/models", label: "Models", icon: Cpu, color: "from-emerald-500 to-teal-500" },
  { href: "/admin/alerts", label: "Health & Alerts", icon: Activity, color: "from-amber-500 to-orange-500" },
  { href: "/admin/broadcast", label: "Announcement", icon: Megaphone, color: "from-rose-500 to-red-500" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user || profile?.role !== "admin") {
        router.replace("/dashboard");
      }
    }
  }, [user, profile, loading, router]);

  if (loading || profile?.role !== "admin") {
    return (
      <div className="aurora-field flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Checking admin access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aurora-field min-h-screen text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-5">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-fuchsia-500 text-white shadow-lg shadow-rose-500/30">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="hidden flex-col leading-none sm:flex">
                <span className="text-sm font-extrabold gradient-text">{SITE.name}</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Admin Console
                </span>
              </span>
            </Link>

            <nav className="hidden gap-1 lg:flex">
              {adminNav.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
                      active
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br text-white transition group-hover:scale-105",
                        item.color,
                        active && "opacity-100"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background/60 px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back to App</span>
            </Link>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 lg:hidden">
          {adminNav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                    : "bg-accent text-muted-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6 animate-fade-up">
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          You are signed in as an administrator — unlimited credits, top package.
        </div>
        {children}
      </main>
    </div>
  );
}
