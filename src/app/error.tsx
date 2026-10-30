"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="aurora-field relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div className="aurora-blob -left-20 top-10 h-72 w-72 bg-violet-500/40" />
      <div className="aurora-blob -right-16 bottom-0 h-72 w-72 bg-fuchsia-500/30" />

      <div className="relative z-10 w-full max-w-lg text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/30">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          We hit an unexpected error while loading this page. Please try again — if it keeps
          happening, contact support.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-violet-500/30 transition hover:scale-105"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/70 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-accent"
          >
            <Home className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
