"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  FolderOpen,
  FileText,
  Trash2,
  Download,
  Clock,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { formatBytes, cn } from "@/lib/utils";
import { authFetch } from "@/lib/api-client";

interface LibraryFileItem {
  id: string;
  name: string;
  fileType: string;
  storagePath: string;
  publicUrl?: string;
  sizeBytes: number;
  source: string;
  expiresAt: string;
  createdAt: string;
  daysLeft: number;
  isExpired: boolean;
}

export default function LibraryPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<LibraryFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await authFetch(`/api/library?userId=${encodeURIComponent(user.uid)}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Failed to fetch library files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [user]);

  const handleDeleteFile = async (fileId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this file immediately?")) return;

    try {
      const res = await authFetch(
        `/api/library?id=${encodeURIComponent(fileId)}&userId=${encodeURIComponent(user.uid)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  const handleRunCleanup = async () => {
    try {
      setCleaning(true);
      setCleanupMessage(null);
      const res = await authFetch("/api/library", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setCleanupMessage(data.message || "30-day auto-purge routine completed.");
        fetchFiles();
      } else {
        setCleanupMessage(data.error || "Cleanup failed.");
      }
    } catch (err: any) {
      setCleanupMessage(err.message || "Failed to trigger cleanup routine.");
    } finally {
      setCleaning(false);
    }
  };

  // Aggregated metrics
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  const expiringSoonCount = files.filter((f) => f.daysLeft <= 5).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header & 30-Day Policy Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            User File Library
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All user-generated outputs, PDFs, images, and chat attachments.
          </p>
        </div>

        <button
          type="button"
          disabled={cleaning}
          onClick={handleRunCleanup}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-accent disabled:opacity-50"
          title="Manually trigger the 30-day TTL storage cleanup routine"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", cleaning && "animate-spin")} />
          <span>{cleaning ? "Purging expired..." : "Run 30-Day Cleanup"}</span>
        </button>
      </div>

      {cleanupMessage && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-foreground flex items-center justify-between">
          <span>{cleanupMessage}</span>
          <button
            onClick={() => setCleanupMessage(null)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Storage and TTL Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FolderOpen className="h-4 w-4 text-primary" />
            <span>Total Stored Assets</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{files.length}</p>
          <p className="text-[11px] text-muted-foreground">Across all AI tools</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HardDrive className="h-4 w-4 text-indigo-500" />
            <span>Storage Consumed</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{formatBytes(totalSizeBytes)}</p>
          <p className="text-[11px] text-muted-foreground">10MB limit per individual file</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>30-Day Auto-Purge Status</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {expiringSoonCount > 0 ? (
              <span className="text-amber-500">{expiringSoonCount} soon</span>
            ) : (
              <span className="text-emerald-500">All Healthy</span>
            )}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Files older than 30 days are automatically deleted
          </p>
        </div>
      </div>

      {/* File List Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border/80 px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Your Files & Retention Timeline</h2>
          <span className="text-xs text-muted-foreground">
            Retention policy: 30 days maximum
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
            Loading library files...
          </div>
        ) : files.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <FolderOpen className="h-6 w-6" />
            </div>
            <p className="font-medium text-foreground">No files in your library yet</p>
            <p className="mt-1 text-xs max-w-sm mx-auto">
              Attachments uploaded in the Chat workspace, generated PDF outputs, and media tools will appear here with an automatic 30-day lifecycle tracker.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {files.map((file) => {
              const isImage = file.fileType.startsWith("image/");
              const isPdf = file.fileType.includes("pdf");

              // Expiration badge styling
              const isExpiringSoon = file.daysLeft <= 5;

              return (
                <div
                  key={file.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 px-6 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Thumbnail or Icon */}
                    {isImage && file.publicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.publicUrl}
                        alt={file.name}
                        className="h-10 w-10 shrink-0 rounded-xl object-cover border border-border"
                      />
                    ) : isPdf ? (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500 font-bold text-xs">
                        PDF
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm text-foreground">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatBytes(file.sizeBytes)}</span>
                        <span>•</span>
                        <span className="capitalize">{file.source || "Chat"}</span>
                        <span>•</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* 30-Day Countdown Badge & Actions */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-xs",
                        isExpiringSoon
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      <span>
                        {file.daysLeft <= 0
                          ? "Expired (Pending Purge)"
                          : `${file.daysLeft} day${file.daysLeft > 1 ? "s" : ""} left`}
                      </span>
                    </div>

                    {file.publicUrl && (
                      <a
                        href={file.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Open/Download file"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                      title="Delete now"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
