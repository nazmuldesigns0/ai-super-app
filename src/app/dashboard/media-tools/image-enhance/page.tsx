"use client";

import React, { useRef, useState } from "react";
import { Wand2, Download, Loader2, AlertTriangle, RefreshCw, Sparkles } from "lucide-react";
import { authFetch } from "@/lib/api-client";
import { notifyOnComplete, prepareNotifications } from "@/lib/notify";
import { cn } from "@/lib/utils";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const PRESETS: { id: string; label: string; prompt: string; description: string }[] = [
  {
    id: "enhance",
    label: "Enhance",
    prompt:
      "enhance this image: sharpen details, improve lighting and contrast, high resolution, professional photography, crisp and clean",
    description: "Sharpen, brighten and clean up the photo.",
  },
  {
    id: "restore",
    label: "Restore",
    prompt:
      "restore this old photo: remove noise and scratches, fix faded colors, highest quality, clear and detailed",
    description: "Repair noise, fading and imperfections.",
  },
  {
    id: "vivid",
    label: "Vivid",
    prompt:
      "make this image vibrant and vivid: rich colors, dramatic lighting, ultra detailed, stunning, 8k",
    description: "Boost colour, contrast and drama.",
  },
];

export default function ImageEnhancePage() {
  const [source, setSource] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [preset, setPreset] = useState(PRESETS[0].id);
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleEnhance = async () => {
    if (!source) {
      setError("Please upload an image first.");
      return;
    }
    const selected = PRESETS.find((p) => p.id === preset) || PRESETS[0];
    const prompt = customPrompt.trim() || selected.prompt;

    setLoading(true);
    setError(null);
    setResult(null);
    prepareNotifications();
    try {
      const res = await authFetch("/api/image/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, image: source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Image enhancement failed.");
      setResult(data.image);
      notifyOnComplete("Nexora AI", "Your enhanced image is ready.");
    } catch (err: any) {
      setError(err?.message || "Image enhancement failed.");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `enhanced-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const reset = () => {
    setSource(null);
    setResult(null);
    setError(null);
    setCustomPrompt("");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Image Enhancement</h1>
        <p className="mt-1 text-muted-foreground">
          Sharpen, restore and improve photos for free with AI (FLUX.2 Klein).
        </p>
      </div>

      {!source && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-border bg-card p-16 text-center transition-colors hover:border-primary"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Sparkles className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-medium">Upload image to enhance</p>
          <p className="mt-2 text-sm text-muted-foreground">PNG, JPG, WEBP up to 10MB.</p>
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
        <>
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
                Enhanced
              </p>
              <div className="flex min-h-40 items-center justify-center rounded-md bg-secondary/30 p-2">
                {loading ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                    <Loader2 className="h-7 w-7 animate-spin" />
                    <p className="text-sm">Enhancing… this can take a few seconds.</p>
                  </div>
                ) : result ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result} alt="Enhanced" className="max-h-72 w-full object-contain" />
                ) : (
                  <p className="py-12 text-sm text-muted-foreground">Your result appears here.</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Enhancement style</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    title={p.description}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                      preset === p.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {PRESETS.find((p) => p.id === preset)?.description}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Custom instructions <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. remove the glare and make it look like a studio shot"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleEnhance}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {loading ? "Enhancing…" : "Enhance Image"}
              </button>
              {result && (
                <button
                  onClick={download}
                  className="flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  <Download className="h-4 w-4" />
                  Download
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
          </div>
        </>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
