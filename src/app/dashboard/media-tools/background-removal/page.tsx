"use client";

import React, { useRef, useState } from "react";
import { Image as ImageIcon, Download, Loader2, AlertTriangle, Eraser, RefreshCw } from "lucide-react";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export default function BackgroundRemovalPage() {
  const [source, setSource] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setResult(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG or WEBP).");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Image is too large. Maximum size is 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSource(reader.result as string);
    reader.onerror = () => setError("Could not read that file.");
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = async () => {
    if (!source) {
      setError("Please upload an image first.");
      return;
    }
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      // Loaded on demand so the heavy WASM/ONNX runtime never blocks initial page load.
      const { removeBackground } = await import("@imgly/background-removal");
      
      const blob = await removeBackground(source, {
        publicPath: "https://static.imgly.com/packages/@imgly/background-removal-data/1.7.0/dist/",
        progress: (key: string, current: number, total: number) => {
          if (total > 0) setProgress(Math.round((current / total) * 100));
        },
      });
      const url = URL.createObjectURL(blob);
      setResult(url);
    } catch (err: any) {
      console.error(err);
      setError(
        "Could not remove the background. The model downloads on first use — please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `background-removed-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const reset = () => {
    setSource(null);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Background Removal</h1>
        <p className="mt-1 text-muted-foreground">
          Remove image backgrounds instantly — runs 100% free in your browser, no data is uploaded.
        </p>
      </div>

      {!source && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-border bg-card p-16 text-center transition-colors hover:border-primary"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <ImageIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-medium">Drop an image here or click to upload</p>
          <p className="mt-2 text-sm text-muted-foreground">
            PNG, JPG, WEBP up to 10MB. Background will be removed automatically.
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {source && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Original
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={source} alt="Original" className="max-h-80 w-full rounded-md object-contain" />
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Result {result && "(transparent)"}
            </p>
            <div className="flex min-h-40 items-center justify-center rounded-md bg-[conic-gradient(at_top_left,_#e5e7eb_25%,_transparent_0_50%,_#e5e7eb_0_75%,_transparent_0)] bg-[length:24px_24px] p-2">
              {loading ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="h-7 w-7 animate-spin" />
                  <p className="text-sm">
                    {progress > 0 ? `Processing… ${progress}%` : "Preparing model…"}
                  </p>
                </div>
              ) : result ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result} alt="Result" className="max-h-72 w-full object-contain" />
              ) : (
                <p className="py-12 text-sm text-muted-foreground">Your cut-out appears here.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {source && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRemoveBackground}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eraser className="h-4 w-4" />}
            {loading ? "Removing…" : "Remove Background"}
          </button>
          {result && (
            <button
              onClick={download}
              className="flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </button>
          )}
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent"
          >
            <RefreshCw className="h-4 w-4" />
            New Image
          </button>
        </div>
      )}
    </div>
  );
}
