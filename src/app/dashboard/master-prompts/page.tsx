"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Search,
  Sliders,
  Copy,
  Check,
  Play,
  Layers,
  Palette,
  Newspaper,
  LayoutGrid,
  Plus,
  ArrowRight,
} from "lucide-react";
import { MASTER_PROMPTS_DATA, MasterPromptDefinition } from "@/data/masterPrompts";
import { MasterPromptModal } from "@/components/master-prompts/MasterPromptModal";
import { cn } from "@/lib/utils";

export default function MasterPromptsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activePrompt, setActivePrompt] = useState<MasterPromptDefinition | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    "All",
    "Magazine & Editorial",
    "Branding & Mockups",
    "Social Media Marketing",
  ];

  const filteredPrompts = MASTER_PROMPTS_DATA.filter((p) => {
    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  const handleCopyRaw = (e: React.MouseEvent, prompt: MasterPromptDefinition) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.compilePrompt({}));
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Magazine & Editorial":
        return Newspaper;
      case "Branding & Mockups":
        return Layers;
      case "Social Media Marketing":
        return LayoutGrid;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Master Prompts Engine</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              v2.0
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Production-grade generative prompts for editorial layout reinvention, photorealistic brand presentations, and shape-driven advertising campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search master prompts..."
              className="w-full rounded-xl border border-input bg-card pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs",
              selectedCategory === cat
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Prompts Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPrompts.map((prompt) => {
          const Icon = getCategoryIcon(prompt.category);
          const isCopied = copiedId === prompt.id;

          return (
            <div
              key={prompt.id}
              onClick={() => setActivePrompt(prompt)}
              className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-xs hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-xs">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    {prompt.badge}
                  </span>
                </div>

                <div className="text-[11px] font-medium text-primary">
                  {prompt.category}
                </div>
                <h3 className="mt-1 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {prompt.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                  {prompt.description}
                </p>

                {/* Form Fields Count Badge */}
                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-medium">
                  <Sliders className="h-3.5 w-3.5 text-primary" />
                  <span>{prompt.formFields.length} customizable parameter fields</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={(e) => handleCopyRaw(e, prompt)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent transition"
                  title="Copy compiled prompt text"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                  <span>Open Form & Run</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Modal Runner */}
      {activePrompt && (
        <MasterPromptModal
          prompt={activePrompt}
          onClose={() => setActivePrompt(null)}
        />
      )}
    </div>
  );
}
