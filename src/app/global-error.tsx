"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#faf9ff",
          color: "#1e1b31",
        }}
      >
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
              The app encountered a critical error. Please try again — if the problem persists,
              reload the page.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-violet-500/30 transition hover:scale-105"
              >
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
