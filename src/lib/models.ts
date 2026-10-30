/**
 * Client-safe model catalogue.
 *
 * This module is intentionally free of any server-only imports (e.g. the
 * `@google/genai` SDK) so client components can read the model list without
 * pulling the provider SDKs into the browser bundle. `lib/gemini.ts`
 * re-exports these values for server-side callers.
 */

export type ModelProvider = "Auto" | "Google" | "Groq" | "OpenRouter" | "Mistral" | "SambaNova" | "Cloudflare" | "xAI" | "OpenAI" | "Anthropic" | "DeepSeek";

/** Providers a model can be assigned to (used by the Admin Panel form). */
export const MODEL_PROVIDERS: ModelProvider[] = [
  "Auto",
  "Google",
  "Groq",
  "Cloudflare",
  "OpenRouter",
  "Mistral",
  "SambaNova",
  "OpenAI",
  "Anthropic",
  "DeepSeek",
  "xAI",
];

export interface ModelDefinition {
  id: string;
  displayName: string;
  provider: ModelProvider;
  badge: string;
  cost: number;
  description: string;
  maxTokens: number;
  isPopular?: boolean;
}

/** Default chat models used when no model is supplied by the caller. */
export const DEFAULT_MODEL_ID = "gemini-2.0-flash";
export const DEFAULT_ARENA_MODEL_ID = "gemini-1.5-flash-8b";

export const SUPPORTED_MODELS: ModelDefinition[] = [
  // Autonomous Smart Router
  {
    id: "auto-router",
    displayName: "Auto Smart Router (Max)",
    provider: "Auto",
    badge: "Smart AI",
    cost: 1,
    description: "Autonomous task classifier: routes coding to Codestral, speed to Groq, math to 120B, and files/vision to Gemini.",
    maxTokens: 1048576,
    isPopular: true,
  },

  // Google Gemini
  {
    id: DEFAULT_MODEL_ID,
    displayName: "Gemini 2.0 Flash",
    provider: "Google",
    badge: "Arena Default",
    cost: 1,
    description: "Next-gen balanced multimodal reasoning, fast speed, and 1M token context.",
    maxTokens: 1048576,
    isPopular: true,
  },
  {
    id: DEFAULT_ARENA_MODEL_ID,
    displayName: "Gemini 1.5 Flash-8B",
    provider: "Google",
    badge: "Ultra Fast",
    cost: 1,
    description: "Lowest latency Gemini model for quick chat and everyday queries.",
    maxTokens: 1048576,
  },

  // Groq Cloud (Ultra Fast LPU Inference)
  {
    id: "qwen/qwen3.8-27b",
    displayName: "Qwen 3.8 27B (Groq)",
    provider: "Groq",
    badge: "Groq Speed",
    cost: 1,
    description: "Lightning-fast inference on Groq LPUs with state-of-the-art multilingual reasoning.",
    maxTokens: 32768,
    isPopular: true,
  },
  {
    id: "openai/gpt-oss-120b",
    displayName: "GPT-OSS 120B (Groq)",
    provider: "Groq",
    badge: "Groq Reasoning",
    cost: 2,
    description: "Powerful open-weight 120B reasoning model running at blazing Groq speeds.",
    maxTokens: 65536,
  },
  {
    id: "openai/gpt-oss-20b",
    displayName: "GPT-OSS 20B (Groq)",
    provider: "Groq",
    badge: "Groq Chat",
    cost: 1,
    description: "Compact, agile and fast response generation on Groq hardware.",
    maxTokens: 32768,
  },

  // Mistral AI
  {
    id: "codestral-latest",
    displayName: "Codestral (Mistral)",
    provider: "Mistral",
    badge: "Code Pro",
    cost: 2,
    description: "Cutting-edge code generation, testing, and debugging by Mistral AI.",
    maxTokens: 32768,
    isPopular: true,
  },
  {
    id: "open-mistral-nemo",
    displayName: "Mistral Nemo 12B",
    provider: "Mistral",
    badge: "Fast & Smart",
    cost: 1,
    description: "Lightweight, highly capable open frontier model by Mistral AI.",
    maxTokens: 32768,
  },
  {
    id: "ministral-8b-latest",
    displayName: "Ministral 8B",
    provider: "Mistral",
    badge: "Edge Speed",
    cost: 1,
    description: "Small, fast, and efficient model for everyday tasks.",
    maxTokens: 32768,
  },

  // Cloudflare Workers AI (Serverless Edge)
  {
    id: "@cf/meta/llama-3.1-8b-instruct",
    displayName: "Llama 3.1 8B (Cloudflare)",
    provider: "Cloudflare",
    badge: "Edge Free",
    cost: 1,
    description: "Free fast global edge inference running on Cloudflare's serverless AI network.",
    maxTokens: 8192,
    isPopular: true,
  },
  {
    id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    displayName: "Llama 3.3 70B (Cloudflare)",
    provider: "Cloudflare",
    badge: "Edge Pro",
    cost: 2,
    description: "Meta's flagship 70B open model at the edge, optimized for speed.",
    maxTokens: 24000,
  },
  {
    id: "@cf/qwen/qwen2.5-coder-32b-instruct",
    displayName: "Qwen2.5 Coder 32B (Cloudflare)",
    provider: "Cloudflare",
    badge: "Edge Code",
    cost: 2,
    description: "Specialized code generation model available free at the edge.",
    maxTokens: 32768,
  },
  {
    id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    displayName: "DeepSeek R1 Distill 32B (Cloudflare)",
    provider: "Cloudflare",
    badge: "Edge Reasoning",
    cost: 2,
    description: "Reasoning-focused distilled model running free on Cloudflare.",
    maxTokens: 32768,
  },

  // NOTE: OpenAI, Anthropic, xAI, DeepSeek and OpenRouter models are hidden
  // because they require a paid key/credits. The provider code below still
  // supports them — re-add an entry here once you have a working key.
];
