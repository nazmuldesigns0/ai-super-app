import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { SITE } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="aurora-field relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div className="aurora-blob -left-20 top-10 h-72 w-72 bg-violet-500/40" />
      <div className="aurora-blob -right-16 bottom-0 h-72 w-72 bg-cyan-400/30" />

      <div className="relative z-10 w-full max-w-lg text-center">
        <span className="animate-float inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-violet-500/30">
          <Compass className="h-7 w-7" />
        </span>
        <p className="gradient-text mt-6 text-6xl font-extrabold sm:text-7xl">404</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you
          back to {SITE.name}.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-violet-500/30 transition hover:scale-105"
          >
            <Home className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
