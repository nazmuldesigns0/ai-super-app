"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles, Zap, Brain, Swords, Check, Bot } from "lucide-react";
import { type ModelProvider } from "@/lib/models";
import { useModels } from "@/hooks/useModels";
import { cn } from "@/lib/utils";
import { DEFAULT_ARENA_MODEL_ID } from "@/lib/models";

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  isArenaMode: boolean;
  onToggleArenaMode: (enabled: boolean) => void;
  modelB?: string;
  onSelectModelB?: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  selectedModel,
  onSelectModel,
  isArenaMode,
  onToggleArenaMode,
  modelB = DEFAULT_ARENA_MODEL_ID,
  onSelectModelB,
  disabled = false,
}: ModelSelectorProps) {
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);
  const refA = useRef<HTMLDivElement>(null);
  const refB = useRef<HTMLDivElement>(null);

  // Models enabled by the admin (falls back to the built-in catalogue).
  const models = useModels();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (refA.current && !refA.current.contains(event.target as Node)) {
        setOpenA(false);
      }
      if (refB.current && !refB.current.contains(event.target as Node)) {
        setOpenB(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentA = models.find((m) => m.id === selectedModel) || models[0];
  const currentB =
    models.find((m) => m.id === modelB) || models[models.length - 1];

  const getProviderColor = (provider: ModelProvider) => {
    switch (provider) {
      case "Auto":
        return "text-violet-500 bg-violet-500/10";
      case "Groq":
        return "text-red-500 bg-red-500/10";
      case "Cloudflare":
        return "text-orange-500 bg-orange-500/10";
      case "OpenRouter":
        return "text-purple-500 bg-purple-500/10";
      case "Mistral":
        return "text-amber-500 bg-amber-500/10";
      case "SambaNova":
        return "text-indigo-500 bg-indigo-500/10";
      case "Google":
        return "text-blue-500 bg-blue-500/10";
      case "DeepSeek":
        return "text-cyan-500 bg-cyan-500/10";
      case "OpenAI":
        return "text-emerald-500 bg-emerald-500/10";
      case "Anthropic":
        return "text-pink-500 bg-pink-500/10";
      case "xAI":
        return "text-foreground bg-foreground/10";
      default:
        return "text-primary bg-primary/10";
    }
  };

  // Group models by provider, honouring the preferred order and appending any
  // provider the admin introduced via a custom model.
  const preferredOrder: ModelProvider[] = [
    "Auto",
    "Groq",
    "Cloudflare",
    "OpenRouter",
    "Mistral",
    "SambaNova",
    "Google",
    "DeepSeek",
    "OpenAI",
    "Anthropic",
    "xAI",
  ];
  const presentProviders = Array.from(new Set(models.map((m) => m.provider)));
  const providers: ModelProvider[] = [
    ...preferredOrder.filter((p) => presentProviders.includes(p)),
    ...presentProviders.filter((p) => !preferredOrder.includes(p)),
  ];

  const renderDropdownList = (
    currentSelectedId: string,
    onSelect: (id: string) => void,
    onClose: () => void
  ) => {
    return (
      <div className="max-h-[420px] overflow-y-auto space-y-3 p-1">
        {providers.map((p) => {
          const modelsInGroup = models.filter((m) => m.provider === p);
          if (modelsInGroup.length === 0) return null;

          return (
            <div key={p} className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border/40 pb-1">
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      p === "Auto" && "bg-gradient-to-r from-violet-500 to-indigo-500 animate-pulse",
                      p === "Groq" && "bg-red-500",
                      p === "Cloudflare" && "bg-orange-500",
                      p === "OpenRouter" && "bg-purple-500",
                      p === "Mistral" && "bg-amber-500",
                      p === "SambaNova" && "bg-indigo-500",
                      p === "Google" && "bg-blue-500",
                      p === "DeepSeek" && "bg-cyan-500",
                      p === "OpenAI" && "bg-emerald-500",
                      p === "Anthropic" && "bg-pink-500",
                      p === "xAI" && "bg-zinc-400"
                    )}
                  />
                  {p}
                </span>
                <span className="text-[9px] font-normal text-muted-foreground/70">
                  {p === "Auto" && "✨ Smart Classifier & Auto Dispatcher"}
                  {p === "Groq" && "⚡ Ultra-Fast LPU (Recommended)"}
                  {p === "Cloudflare" && "🆓 Free Serverless Edge AI"}
                  {p === "OpenRouter" && "🌐 Universal Gateway"}
                  {p === "Mistral" && "💻 Coding & Reasoning"}
                  {p === "SambaNova" && "🚀 Fast RDU Chips"}
                  {p === "Google" && "🧠 1M Context & Vision"}
                  {p === "DeepSeek" && "🔬 Math & Logic"}
                  {p === "OpenAI" && "🤖 GPT-4o Flagship"}
                  {p === "Anthropic" && "✍️ Claude 3.5"}
                  {p === "xAI" && "🌌 Grok Intelligence"}
                </span>
              </div>

              {modelsInGroup.map((model) => {
                const isSelected = model.id === currentSelectedId;
                const badgeColor = getProviderColor(model.provider);

                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onSelect(model.id);
                      onClose();
                    }}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-xl p-2 text-left text-xs transition-colors hover:bg-accent",
                      isSelected && "bg-accent/80 font-medium"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        badgeColor
                      )}
                    >
                      {model.provider.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-semibold text-foreground truncate">
                            {model.displayName}
                          </span>
                          {model.isPopular && (
                            <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.2 shrink-0">
                              ★ Recommended
                            </span>
                          )}
                        </div>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary ml-1 shrink-0">
                          {model.cost} cr
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground line-clamp-1">
                        {model.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 self-center" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Model A Selector */}
      <div className="relative" ref={refA}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpenA(!openA)}
          className={cn(
            "flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 backdrop-blur px-3 py-1.5 text-xs sm:text-sm font-medium shadow-sm transition-all hover:border-primary/50 hover:bg-accent/40",
            openA && "ring-2 ring-primary/20 border-primary"
          )}
        >
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-md font-bold text-[10px]",
              getProviderColor(currentA.provider)
            )}
          >
            {currentA.provider.charAt(0)}
          </div>
          <span className="font-semibold text-foreground truncate max-w-[140px] sm:max-w-[200px]">
            {isArenaMode ? `Model A: ${currentA.displayName}` : currentA.displayName}
          </span>
          <span className="hidden sm:inline-block rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {currentA.provider}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {openA && (
          <div className="absolute left-0 top-full z-50 mt-1.5 w-[340px] sm:w-[420px] max-w-[95vw] rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
            <div className="px-2 py-1.5 text-[11px] font-bold text-foreground flex items-center justify-between">
              <span>{isArenaMode ? "Select Model A (Primary)" : "Select AI Model"}</span>
              <span className="text-[10px] text-muted-foreground font-normal">Click any model to switch</span>
            </div>
            {renderDropdownList(currentA.id, onSelectModel, () => setOpenA(false))}
          </div>
        )}
      </div>

      {/* Arena Mode Model B Selector */}
      {isArenaMode && (
        <>
          <span className="text-xs font-black text-amber-500">VS</span>
          <div className="relative" ref={refB}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpenB(!openB)}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 backdrop-blur px-3 py-1.5 text-xs sm:text-sm font-medium shadow-sm transition-all hover:border-amber-500/50 hover:bg-accent/40",
                openB && "ring-2 ring-amber-500/20 border-amber-500"
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-md font-bold text-[10px]",
                  getProviderColor(currentB.provider)
                )}
              >
                {currentB.provider.charAt(0)}
              </div>
              <span className="font-semibold text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                Model B: {currentB.displayName}
              </span>
              <span className="hidden sm:inline-block rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {currentB.provider}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {openB && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-[340px] sm:w-[420px] max-w-[95vw] rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
                <div className="px-2 py-1.5 text-[11px] font-bold text-foreground flex items-center justify-between">
                  <span>Select Competitor Model B</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Dual Battle</span>
                </div>
                {renderDropdownList(
                  currentB.id,
                  (id) => onSelectModelB?.(id),
                  () => setOpenB(false)
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Arena Mode Toggle Switch */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggleArenaMode(!isArenaMode)}
        className={cn(
          "ml-auto flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all shadow-sm",
          isArenaMode
            ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
            : "border-border bg-background hover:bg-accent text-muted-foreground"
        )}
        title="Toggle LMSYS-Style Arena Dual Model Battle"
      >
        <Swords className={cn("h-3.5 w-3.5", isArenaMode && "text-amber-500")} />
        <span>Arena Battle</span>
        <span
          className={cn(
            "ml-1 h-2 w-2 rounded-full",
            isArenaMode ? "bg-amber-500 animate-pulse" : "bg-muted-foreground/40"
          )}
        />
      </button>
    </div>
  );
}
