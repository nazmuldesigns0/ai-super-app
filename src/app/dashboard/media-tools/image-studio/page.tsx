"use client";

import React, { useRef, useState } from "react";
import {
  Sparkles,
  Wand2,
  Download,
  Upload,
  Loader2,
  AlertTriangle,
  ImageIcon,
  RefreshCw,
} from "lucide-react";
import { authFetch } from "@/lib/api-client";
import { notifyOnComplete, prepareNotifications } from "@/lib/notify";
import { cn } from "@/lib/utils";

type Mode = "generate" | "edit";

interface GenResult {
  image: string;
  model: string;
  modelName: string;
  prompt?: string;
}

const GENERATE_MODELS = [
  {
    id: "@cf/black-forest-labs/flux-1-schnell",
    displayName: "FLUX.1 Schnell",
    description: "Best quality, very fast (4 steps).",
  },
  {
    id: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    displayName: "Stable Diffusion XL",
    description: "Classic SDXL, supports negative prompts.",
  },
];

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export default function ImageStudioPage() {
  const [mode, setMode] = useState<Mode>("generate");

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [model, setModel] = useState(GENERATE_MODELS[0].id);
  const [steps, setSteps] = useState(4);

  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetResult = () => {
    setResult(null);
    setError(null);
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG or WEBP).");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Image is too large. Maximum size is 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSourceImage(reader.result as string);
    reader.onerror = () => setError("Could not read that file.");
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt describing the image you want.");
      return;
    }
    setLoading(true);
    resetResult();
    prepareNotifications();
    try {
      const res = await authFetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          steps,
          negativePrompt: negativePrompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Image generation failed.");
      setResult({ ...data, prompt: prompt.trim() });
      notifyOnComplete("Nexora AI", "Your image is ready.");
    } catch (err: any) {
      setError(err?.message || "Image generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!sourceImage) {
      setError("Please upload an image to edit.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please describe how you want to transform the image.");
      return;
    }
    setLoading(true);
    resetResult();
    prepareNotifications();
    try {
      const res = await authFetch("/api/image/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image: sourceImage,
          steps: 20,
          negativePrompt: negativePrompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Image editing failed.");
      setResult({ ...data, prompt: prompt.trim() });
      notifyOnComplete("Nexora AI", "Your edited image is ready.");
    } catch (err: any) {
      setError(err?.message || "Image editing failed.");
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.image;
    a.download = `ai-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isEdit = mode === "edit";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Image Studio</h1>
        <p className="mt-1 text-muted-foreground">
          Generate and edit images for free using Cloudflare Workers AI (FLUX.1 &amp; SDXL).
        </p>
      </div>

      {/* Mode tabs */}
      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        <button
          onClick={() => {
            setMode("generate");
            setSteps(4);
            resetResult();
          }}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            !isEdit ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Generate
        </button>
        <button
          onClick={() => {
            setMode("edit");
            setSteps(20);
            resetResult();
          }}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            isEdit ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Wand2 className="h-4 w-4" />
          Edit / Restyle
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controls */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          {isEdit && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Source Image</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/40 p-6 text-center transition-colors hover:border-primary"
              >
                {sourceImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sourceImage}
                    alt="Source"
                    className="max-h-48 rounded-md object-contain"
                  />
                ) : (
                  <>
                    <Upload className="mb-2 h-7 w-7 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload an image</p>
                    <p className="mt-1 text-xs text-muted-foreground">PNG, JPG or WEBP, up to 10MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {sourceImage && (
                <button
                  onClick={() => {
                    setSourceImage(null);
                    resetResult();
                  }}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Remove image
                </button>
              )}
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {GENERATE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} — {m.description}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {isEdit ? "How should it change?" : "Prompt"}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder={
                isEdit
                  ? "e.g. turn this photo into a vivid oil painting"
                  : "e.g. a serene mountain lake at sunrise, ultra detailed, 4k"
              }
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Negative prompt <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="e.g. blurry, low quality, watermark"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="mb-1.5 flex items-center justify-between text-sm font-medium">
                <span>Quality steps</span>
                <span className="text-muted-foreground">{steps}</span>
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                className="w-full accent-[hsl(var(--primary))]"
              />
            </div>
          )}

          <button
            onClick={isEdit ? handleEdit : handleGenerate}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? "Transforming..." : "Generating..."}
              </>
            ) : (
              <>
                {isEdit ? <Wand2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                {isEdit ? "Transform Image" : "Generate Image"}
              </>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="flex flex-col rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Result</h2>
            {result && (
              <div className="flex items-center gap-3">
                <button
                  onClick={downloadResult}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  onClick={resetResult}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 p-4">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Working on it… this can take a few seconds.</p>
              </div>
            ) : result ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.image}
                alt={result.prompt || "Generated image"}
                className="max-h-[420px] w-full rounded-md object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                <p className="text-sm">Your image will appear here.</p>
              </div>
            )}
          </div>

          {result && (
            <p className="mt-3 text-xs text-muted-foreground">
              Generated with <span className="font-medium text-foreground">{result.modelName}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
