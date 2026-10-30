"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Brain, Cpu, FileSearch, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiProgressIndicatorProps {
  hasAttachments?: boolean;
  modelName?: string;
}

export function AiProgressIndicator({
  hasAttachments = false,
  modelName = "Gemini 3.8 Flash",
}: AiProgressIndicatorProps) {
  const [progress, setProgress] = useState(12);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    {
      label: hasAttachments
        ? "Uploading & parsing multimodal documents..."
        : "Initializing Gemini inference session...",
      icon: FileSearch,
      targetPercent: 32,
    },
    {
      label: `Reasoning with ${modelName}...`,
      icon: Brain,
      targetPercent: 64,
    },
    {
      label: "Synthesizing insights and streaming tokens...",
      icon: Cpu,
      targetPercent: 88,
    },
    {
      label: "Finalizing response & formatting structure...",
      icon: Sparkles,
      targetPercent: 96,
    },
  ];

  useEffect(() => {
    // Dynamic progressive realistic animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // Hold at 95% until server returns
        const nextVal = prev + Math.floor(Math.random() * 5 + 3);
        return Math.min(nextVal, 95);
      });
    }, 380);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 30) {
      setCurrentStepIndex(0);
    } else if (progress < 60) {
      setCurrentStepIndex(1);
    } else if (progress < 85) {
      setCurrentStepIndex(2);
    } else {
      setCurrentStepIndex(3);
    }
  }, [progress]);

  const CurrentIcon = steps[currentStepIndex].icon;

  return (
    <div className="flex w-full max-w-xl flex-col rounded-2xl border border-primary/20 bg-card/90 p-4 shadow-lg backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CurrentIcon className="h-4 w-4 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground tracking-tight">
              {steps[currentStepIndex].label}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Powered by {modelName}
            </p>
          </div>
        </div>
        <div className="font-mono text-xs font-bold text-primary">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Animated glowing progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-indigo-500 to-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
          style={{ width: "100%" }}
        />
      </div>

      {/* Multi-step pipeline breadcrumb */}
      <div className="mt-3 grid grid-cols-4 gap-1 text-[10px]">
        {steps.map((s, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-1 truncate transition-colors",
                isDone && "text-primary font-medium",
                isCurrent && "text-foreground font-semibold",
                !isDone && !isCurrent && "text-muted-foreground/50"
              )}
            >
              {isDone ? (
                <CheckCircle2 className="h-2.5 w-2.5 text-primary shrink-0" />
              ) : (
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    isCurrent ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                  )}
                />
              )}
              <span className="truncate">Step {idx + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
