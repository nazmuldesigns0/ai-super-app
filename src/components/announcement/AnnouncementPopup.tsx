"use client";

import { useEffect, useState } from "react";
import { Info, CheckCircle2, AlertTriangle, Megaphone, X } from "lucide-react";
import type { Announcement, AnnouncementTone } from "@/lib/announcement";
import { cn } from "@/lib/utils";

const SEEN_KEY = "nexora_announcement_seen";

/** Tone → icon + gradient header. */
const TONE_STYLES: Record<
  AnnouncementTone,
  { icon: typeof Info; gradient: string; ring: string }
> = {
  info: {
    icon: Info,
    gradient: "from-violet-600 via-fuchsia-600 to-cyan-500",
    ring: "text-violet-500 bg-violet-500/10",
  },
  success: {
    icon: CheckCircle2,
    gradient: "from-emerald-600 via-teal-500 to-cyan-500",
    ring: "text-emerald-500 bg-emerald-500/10",
  },
  warning: {
    icon: AlertTriangle,
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    ring: "text-amber-500 bg-amber-500/10",
  },
};

/**
 * Site-wide notice shown once to each visitor whenever the admin publishes a
 * new announcement (tracked by a `version` stored in localStorage).
 */
export function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/announcement")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        const next: Announcement | null = data?.announcement || null;
        if (!next) return;

        // Show again only when the wording changed since it was last dismissed.
        let lastSeen = "0";
        try {
          lastSeen = window.localStorage.getItem(SEEN_KEY) || "0";
        } catch {
          /* storage unavailable (private mode) — show the notice */
        }
        if (String(next.version) === lastSeen) return;

        setAnnouncement(next);
        setOpen(true);
      })
      .catch(() => {
        /* no announcement to show */
      });

    return () => {
      active = false;
    };
  }, []);

  const dismiss = () => {
    if (announcement) {
      try {
        window.localStorage.setItem(SEEN_KEY, String(announcement.version));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  };

  if (!open || !announcement) return null;

  const tone = TONE_STYLES[announcement.tone] || TONE_STYLES.info;
  const Icon = tone.icon;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={announcement.title || "Announcement"}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={dismiss}
      />

      <div className="animate-pop-in relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className={cn("bg-gradient-to-r p-4 text-white", tone.gradient)}>
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-bold">
              <Megaphone className="h-4 w-4" /> Announcement
            </p>
            <button
              onClick={dismiss}
              aria-label="Close announcement"
              className="rounded-lg p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 p-5">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                tone.ring
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              {announcement.title && (
                <h2 className="text-base font-bold text-foreground">
                  {announcement.title}
                </h2>
              )}
              {announcement.message && (
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {announcement.message}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={dismiss}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
