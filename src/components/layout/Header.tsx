"use client";

import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/components/providers/AuthProvider";

export function Header() {
  const { profile } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-4 md:px-6 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="md:hidden font-semibold">AI Super</div>

      <div className="flex items-center gap-4 ml-auto">
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm">
          <span className="text-muted-foreground">Credits</span>
          <span className="font-semibold">{profile?.creditBalance ?? 0}</span>
        </div>

        <ThemeToggle />

        {profile && (
          <div className="flex items-center gap-2">
            {profile.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoURL}
                alt={profile.fullName}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                {profile.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <span className="hidden sm:inline text-sm font-medium">
              {profile.fullName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
