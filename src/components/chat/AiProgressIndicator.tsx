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
        ? "Processing documents..."
        : "Connecting to AI...",
      icon: FileSearch,
      targetPercent: 32,
    },
    {
      label: `Generating with ${modelName}...`,
      icon: Brain,
      targetPercent: 64,
    },
    {
      label: "Streaming response...",
      icon: Cpu,
      targetPercent: 88,
    },
    {
      label: "Finishing up...",
      icon: Sparkles,
      targetPercent: 96,
    },
  ];

  useEffect(() => {
    // Dynamic progressive realistic animation - FASTER
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98; 
        const nextVal = prev + Math.floor(Math.random() * 10 + 5);
        return Math.min(nextVal, 98);
      });
    }, 200);

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
    </div>
  );
}
