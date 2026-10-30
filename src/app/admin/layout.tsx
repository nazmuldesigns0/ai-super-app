"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || profile?.role !== "admin") {
        router.replace("/dashboard");
      }
    }
  }, [user, profile, loading, router]);

  if (loading || profile?.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold">
              Admin
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin/users" className="text-muted-foreground hover:text-foreground">
                Users
              </Link>
              <Link href="/admin/usage" className="text-muted-foreground hover:text-foreground">
                Usage
              </Link>
              <Link href="/admin/models" className="text-muted-foreground hover:text-foreground">
                Models
              </Link>
              <Link href="/admin/alerts" className="text-muted-foreground hover:text-foreground">
                Health & Alerts
              </Link>
              <Link href="/admin/broadcast" className="text-muted-foreground hover:text-foreground">
                Broadcast
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to App
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
