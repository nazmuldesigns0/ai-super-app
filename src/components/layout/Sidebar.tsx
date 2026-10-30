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
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/chat", label: "AI Chat & Arena", icon: MessageSquare },
  { href: "/dashboard/media-tools/image-studio", label: "Image Studio", icon: Palette },
  { href: "/dashboard/master-prompts", label: "Master Prompts", icon: Sparkles },
  { href: "/dashboard/library", label: "Library (30d)", icon: FolderOpen },
  {
    href: "/dashboard/media-tools/background-removal",
    label: "BG Removal",
    icon: Image,
  },
  {
    href: "/dashboard/media-tools/image-enhance",
    label: "Enhance",
    icon: Wand2,
  },
  { href: "/dashboard/credits", label: "Credits", icon: CreditCard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];


export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg">
          <LayoutDashboard className="h-6 w-6" />
          <span>AI Super</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mt-4",
              pathname.startsWith("/admin")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Admin Panel
          </Link>
        )}
      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-3 px-3 text-xs text-muted-foreground">
          Credits: <span className="font-semibold text-foreground">{profile?.creditBalance ?? 0}</span>
        </div>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
