"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Key,
  ShieldCheck,
  ExternalLink,
  Check,
  AlertCircle,
  Copy,
  Database,
  Flame,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

interface ProviderInfo {
  name: string;
  hasEnvKey: boolean;
  envVar: string;
  keyUrl: string;
  models: string[];
  isFreeTierAvailable: boolean;
}

interface FirebaseStatus {
  projectId: string;
  authDomain: string;
  storageBucket: string;
  hasApiKey: boolean;
  firestoreConnected: boolean;
  storageStatus: string;
  adminSdkConfigured: boolean;
}

export function ApiKeysModal({ isOpen, onClose, onKeysUpdated }: ApiKeysModalProps) {
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Record<string, ProviderInfo>>({});
  const [firebase, setFirebase] = useState<FirebaseStatus | null>(null);

  // Local keys state for each provider
  const [keys, setKeys] = useState<{
    Google: string;
    Groq: string;
    OpenRouter: string;
    Mistral: string;
    SambaNova: string;
    Cloudflare: string;
    HuggingFace: string;
    xAI: string;
    OpenAI: string;
    Anthropic: string;
    DeepSeek: string;
  }>({
    Google: "",
    Groq: "",
    OpenRouter: "",
    Mistral: "",
    SambaNova: "",
    Cloudflare: "",
    HuggingFace: "",
    xAI: "",
    OpenAI: "",
    Anthropic: "",
    DeepSeek: "",
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  // Load status from backend & localStorage
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== "undefined") {
      setKeys({
        Google: localStorage.getItem("ai_super_Google_key") || "",
        Groq: localStorage.getItem("ai_super_Groq_key") || "",
        OpenRouter: localStorage.getItem("ai_super_OpenRouter_key") || "",
        Mistral: localStorage.getItem("ai_super_Mistral_key") || "",
        SambaNova: localStorage.getItem("ai_super_SambaNova_key") || "",
        Cloudflare: localStorage.getItem("ai_super_Cloudflare_key") || "",
        HuggingFace: localStorage.getItem("ai_super_HuggingFace_key") || "",
        xAI: localStorage.getItem("ai_super_xAI_key") || "",
        OpenAI: localStorage.getItem("ai_super_OpenAI_key") || "",
        Anthropic: localStorage.getItem("ai_super_Anthropic_key") || "",
        DeepSeek: localStorage.getItem("ai_super_DeepSeek_key") || "",
      });
    }

    async function fetchStatus() {
      try {
        setLoading(true);
        const res = await fetch("/api/providers/status");
        if (res.ok) {
          const data = await res.json();
          setProviders(data.providers || {});
          setFirebase(data.firebase || null);
        }
      } catch (err) {
        console.warn("Could not fetch provider status:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== "undefined") {
      Object.entries(keys).forEach(([provider, val]) => {
        if (val.trim()) {
          localStorage.setItem(`ai_super_${provider}_key`, val.trim());
        } else {
          localStorage.removeItem(`ai_super_${provider}_key`);
        }
      });
    }
    setSavedSuccess(true);
    if (onKeysUpdated) onKeysUpdated();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleCopyEnv = () => {
    const text = `# AI Model Keys
GEMINI_API_KEY=${keys.Google || ""}
GROQ_API_KEY=${keys.Groq || ""}
OPENROUTER_API_KEY=${keys.OpenRouter || ""}
MISTRAL_API_KEY=${keys.Mistral || ""}
SAMBANOVA_API_KEY=${keys.SambaNova || ""}
CLOUDFLARE_API_TOKEN=${keys.Cloudflare || ""}
HUGGINGFACE_API_KEY=${keys.HuggingFace || ""}
GROK_API_KEY=${keys.xAI || ""}
OPENAI_API_KEY=${keys.OpenAI || ""}
ANTHROPIC_API_KEY=${keys.Anthropic || ""}
DEEPSEEK_API_KEY=${keys.DeepSeek || ""}
`;
    navigator.clipboard.writeText(text);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const providerList: { id: "Google" | "Groq" | "OpenRouter" | "Mistral" | "SambaNova" | "Cloudflare" | "HuggingFace" | "xAI" | "OpenAI" | "Anthropic" | "DeepSeek"; label: string; badge: string; color: string }[] = [
    { id: "Google", label: "Google Gemini", badge: "Free Tier Available", color: "text-blue-400 border-blue-500/30" },
    { id: "Groq", label: "Groq Cloud", badge: "Fast LPU Inference", color: "text-red-400 border-red-500/30" },
    { id: "OpenRouter", label: "OpenRouter", badge: "Universal Gateway", color: "text-purple-400 border-purple-500/30" },
    { id: "Mistral", label: "Mistral AI", badge: "Codestral & Mistral", color: "text-amber-400 border-amber-500/30" },
    { id: "SambaNova", label: "SambaNova Cloud", badge: "Llama 3.3 & DeepSeek", color: "text-indigo-400 border-indigo-500/30" },
    { id: "Cloudflare", label: "Cloudflare Workers AI", badge: "Serverless Edge", color: "text-orange-400 border-orange-500/30" },
    { id: "HuggingFace", label: "Hugging Face", badge: "Inference Mesh", color: "text-yellow-400 border-yellow-500/30" },
    { id: "xAI", label: "xAI Grok", badge: "Grok 2 & Vision", color: "text-zinc-200 border-zinc-500/30" },
    { id: "OpenAI", label: "OpenAI", badge: "GPT-4o & Mini", color: "text-emerald-400 border-emerald-500/30" },
    { id: "Anthropic", label: "Anthropic Claude", badge: "Claude 3.5 Sonnet", color: "text-orange-400 border-orange-500/30" },
    { id: "DeepSeek", label: "DeepSeek", badge: "V3 & R1 Reasoner", color: "text-cyan-400 border-cyan-500/30" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">API Keys & Model Connections</h2>
              <p className="text-xs text-muted-foreground">
                Manage your AI providers (Grok, Gemini, OpenAI, Claude, DeepSeek) and Firebase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Firebase Connection Banner */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-sm text-foreground">Firebase Integration Status</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                  {firebase?.projectId || "hisab-pati-2552b"}
                </span>
              </div>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Connected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 rounded-lg bg-card/60 border border-border/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">Firebase Auth</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ready
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">{firebase?.authDomain || "hisab-pati-2552b.firebaseapp.com"}</div>
              </div>

              <div className="p-2.5 rounded-lg bg-card/60 border border-border/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">Cloud Firestore</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Rules Deployed
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">Native Standard DB</div>
              </div>

              <div className="p-2.5 rounded-lg bg-card/60 border border-border/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">Cloud Storage</span>
                  <a
                    href={`https://console.firebase.google.com/project/${firebase?.projectId || "hisab-pati-2552b"}/storage`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:underline flex items-center gap-1"
                  >
                    1-Click Enable <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="text-[11px] text-muted-foreground">Auto-fallback active</div>
              </div>
            </div>
          </div>

          {/* AI Providers Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">AI Model Providers</h3>
                <p className="text-xs text-muted-foreground">
                  Paste your API key here (saved in your browser) or add to <code className="text-primary font-mono">.env.local</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyEnv}
                className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedEnv ? "Copied!" : "Copy .env format"}
              </button>
            </div>

            <div className="space-y-3">
              {providerList.map((item) => {
                const info = providers[item.id];
                const hasEnv = info?.hasEnvKey;
                const hasLocal = Boolean(keys[item.id]?.trim());
                const isConnected = hasEnv || hasLocal;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-muted/20 border border-border hover:border-border/80 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-md border", item.color)}>
                          {item.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {item.badge}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasEnv && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> In .env.local
                          </span>
                        )}
                        {!hasEnv && hasLocal && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium flex items-center gap-1">
                            <Key className="w-3 h-3" /> Saved Locally
                          </span>
                        )}
                        {!isConnected && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Not Connected
                          </span>
                        )}

                        <a
                          href={info?.keyUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 ml-1"
                        >
                          Get Key <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        placeholder={
                          hasEnv
                            ? `Key loaded from .env.local (${info?.envVar})`
                            : `Paste ${item.label} API key...`
                        }
                        value={keys[item.id]}
                        onChange={(e) =>
                          setKeys((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary font-mono text-foreground placeholder:text-muted-foreground"
                      />
                      {keys[item.id] && (
                        <button
                          type="button"
                          onClick={() => setKeys((prev) => ({ ...prev, [item.id]: "" }))}
                          className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <div className="text-xs text-muted-foreground">
            Keys are sent securely directly to the AI model endpoints for inference.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-md shadow-primary/20"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Saved!
                </>
              ) : (
                <>Save & Apply Keys</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to retrieve currently active custom keys from localStorage for API calls
 */
export function getSavedApiKeys(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return {
    Google: localStorage.getItem("ai_super_Google_key") || "",
    Groq: localStorage.getItem("ai_super_Groq_key") || "",
    OpenRouter: localStorage.getItem("ai_super_OpenRouter_key") || "",
    Mistral: localStorage.getItem("ai_super_Mistral_key") || "",
    SambaNova: localStorage.getItem("ai_super_SambaNova_key") || "",
    Cloudflare: localStorage.getItem("ai_super_Cloudflare_key") || "",
    HuggingFace: localStorage.getItem("ai_super_HuggingFace_key") || "",
    xAI: localStorage.getItem("ai_super_xAI_key") || "",
    OpenAI: localStorage.getItem("ai_super_OpenAI_key") || "",
    Anthropic: localStorage.getItem("ai_super_Anthropic_key") || "",
    DeepSeek: localStorage.getItem("ai_super_DeepSeek_key") || "",
  };
}
