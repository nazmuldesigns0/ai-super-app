"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Send,
  MessageSquare,
  FileCode,
  Sliders,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import type { MasterPromptDefinition } from "@/data/masterPrompts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/api-client";

interface MasterPromptModalProps {
  prompt: MasterPromptDefinition | null;
  onClose: () => void;
}

export function MasterPromptModal({ prompt, onClose }: MasterPromptModalProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"form" | "preview" | "output">("form");
  const [compiledPrompt, setCompiledPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationOutput, setGenerationOutput] = useState<string | null>(null);
  const [tokensUsed, setTokensUsed] = useState<number | null>(null);

  // Initialize form default values
  useEffect(() => {
    if (prompt) {
      const initial: Record<string, string> = {};
      prompt.formFields.forEach((field) => {
        initial[field.key] = field.defaultValue || "";
      });
      setFormValues(initial);
      setCompiledPrompt(prompt.compilePrompt(initial));
      setGenerationOutput(null);
      setActiveTab("form");
    }
  }, [prompt]);

  // Update compiled prompt whenever form values change
  const handleFieldChange = (key: string, value: string) => {
    const updated = { ...formValues, [key]: value };
    setFormValues(updated);
    if (prompt) {
      setCompiledPrompt(prompt.compilePrompt(updated));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunInChat = () => {
    // Save to sessionStorage or pass as query param so Chat page loads it
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ai_super_initial_prompt", compiledPrompt);
    }
    router.push("/dashboard/chat");
  };

  const handleExecuteWithGemini = async () => {
    if (!compiledPrompt) return;
    setIsGenerating(true);
    setActiveTab("output");
    setGenerationOutput(null);

    try {
      const res = await authFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: compiledPrompt,
          model: "gemini-3.8-flash",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setGenerationOutput(data.content);
      setTokensUsed(data.tokensUsed);
    } catch (err: any) {
      setGenerationOutput(`⚠️ **Generation Failed**: ${err.message || "Please check your Gemini API key."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!prompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{prompt.title}</h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {prompt.badge}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{prompt.category}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border px-6 bg-background">
          <button
            onClick={() => setActiveTab("form")}
            className={cn(
              "flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-all",
              activeTab === "form"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Interactive Form</span>
          </button>

          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-all",
              activeTab === "preview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Live Compiled Prompt</span>
          </button>

          {generationOutput && (
            <button
              onClick={() => setActiveTab("output")}
              className={cn(
                "flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-all",
                activeTab === "output"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>AI Output</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "form" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Overview: </span>
                {prompt.description}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {prompt.formFields.map((field) => (
                  <div
                    key={field.key}
                    className={cn(
                      "space-y-1.5",
                      (field.type === "textarea" || field.key === "culture" || field.key === "theme") &&
                        "sm:col-span-2"
                    )}
                  >
                    <label className="block text-xs font-semibold text-foreground">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>

                    {field.type === "select" ? (
                      <select
                        value={formValues[field.key] || ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formValues[field.key] || ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    )}

                    {field.helperText && (
                      <p className="text-[10px] text-muted-foreground">{field.helperText}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  This complete structured prompt will be passed to Gemini:
                </p>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Full Prompt</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="max-h-[50vh] overflow-y-auto rounded-2xl border border-border bg-muted/40 p-4 text-[11px] leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">
                {compiledPrompt}
              </pre>
            </div>
          )}

          {activeTab === "output" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Generated by Gemini 3.8 Flash</span>
                  </span>
                  {tokensUsed && (
                    <span className="text-xs text-muted-foreground">
                      • {tokensUsed} tokens
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generationOutput || "");
                    alert("Output copied to clipboard!");
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Result</span>
                </button>
              </div>

              {isGenerating ? (
                <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="font-semibold text-foreground">
                    Reasoning and executing Master Prompt with Gemini...
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Synthesizing editorial standards, grid structures, and brand rules.
                  </p>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {generationOutput || ""}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4 bg-card">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied Prompt" : "Copy Prompt"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunInChat}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition shadow-sm"
            >
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span>Open in Chat Workspace</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleExecuteWithGemini}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:opacity-95 active:scale-[0.98] transition disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isGenerating ? "Executing..." : "Execute with Gemini"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
