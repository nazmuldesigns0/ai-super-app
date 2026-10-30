import { GoogleGenAI } from "@google/genai";
import type { Attachment } from "@/types";

// Model catalogue lives in a client-safe module so client components can read
// it without pulling the `@google/genai` SDK into the browser bundle.
import { SUPPORTED_MODELS, type ModelDefinition } from "@/lib/models";

export { SUPPORTED_MODELS };
export type { ModelDefinition, ModelProvider } from "@/lib/models";

/**
 * Models managed from the Admin Panel (loaded from Firestore). When present
 * they take precedence over the built-in catalogue so admins can add, edit or
 * disable models without a code change.
 */
let runtimeModels: ModelDefinition[] = [];

export function registerRuntimeModels(models: ModelDefinition[]): void {
  if (Array.isArray(models) && models.length > 0) runtimeModels = models;
}

function resolveModelDefinition(id: string): ModelDefinition | undefined {
  return runtimeModels.find((m) => m.id === id) || SUPPORTED_MODELS.find((m) => m.id === id);
}

export interface GenerateModelOptions {
  model?: string;
  prompt: string;
  history?: { role: "user" | "assistant"; content: string }[];
  attachments?: Attachment[];
  systemInstruction?: string;
  customApiKey?: string;
}

export interface GenerateModelResult {
  text: string;
  modelUsed: string;
  tokensUsed?: number;
}

export function sanitizeErrorMessage(errMsg: string): string {
  if (!errMsg) return "Unknown error occurred";
  return errMsg
    .replace(/gsk_[a-zA-Z0-9_-]+/g, "gsk_••••••••")
    .replace(/sk-or-[a-zA-Z0-9_-]+/g, "sk-or-••••••••")
    .replace(/mstrl_[a-zA-Z0-9_-]+/g, "mstrl_••••••••")
    .replace(/cfut_[a-zA-Z0-9_-]+/g, "cfut_••••••••")
    .replace(/hf_[a-zA-Z0-9_-]+/g, "hf_••••••••")
    .replace(/AIza[a-zA-Z0-9_-]+/g, "AIza••••••••")
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer ••••••••");
}

/**
 * Autonomous Task Classifier:
 * Analyzes the user's prompt text and attachments to pick the best model across all configured providers.
 */
export function detectBestModelForPrompt(
  prompt: string,
  hasAttachments: boolean = false
): { targetModel: string; reason: string } {
  // 1. If files/images attached -> Gemini is best for multimodal 1M context
  if (hasAttachments) {
    return {
      targetModel: "gemini-2.0-flash",
      reason: "Multimodal Vision & Document Processing",
    };
  }

  const p = prompt.toLowerCase();

  // 2. Coding, programming, debugging, scripts, web dev
  const codeKeywords = [
    "function", "code", "debug", "script", "python", "javascript", "typescript",
    "html", "css", "sql", "react", "nextjs", "bug", "syntax", "api", "json",
    "class ", "def ", "const ", "let ", "var ", "git", "regex", "database",
    "algorithm", "backend", "frontend", "npm", "error"
  ];
  if (codeKeywords.some((kw) => p.includes(kw))) {
    return {
      targetModel: "codestral-latest",
      reason: "Coding & Software Engineering Specialist (Mistral)",
    };
  }

  // 3. Complex reasoning, math, logical deduction, architecture, strategy
  const reasoningKeywords = [
    "solve", "calculate", "prove", "math", "why", "logic", "reasoning", "compare",
    "analyze", "evaluate", "architecture", "strategy", "step by step", "deep dive"
  ];
  if (reasoningKeywords.some((kw) => p.includes(kw))) {
    return {
      targetModel: "openai/gpt-oss-120b",
      reason: "Deep Reasoning & High-Token Math Analysis (Groq 120B)",
    };
  }

  // 4. Ultra-fast conversational intelligence, translation, summary, general query
  return {
    targetModel: "qwen/qwen3.8-27b",
    reason: "Instant LPU Speed & Multilingual Chat (Groq)",
  };
}

/**
 * Universal Multi-Provider AI Caller
 * Dispatches to Gemini, Groq, OpenRouter, Mistral, SambaNova, Cloudflare, OpenAI, Claude, or DeepSeek.
 */
export async function generateContentUniversal(
  options: GenerateModelOptions
): Promise<GenerateModelResult> {
  const modelId = options.model || "auto-router";

  // Handle Autonomous Smart Router
  if (modelId === "auto-router") {
    const hasAttachments = Boolean(options.attachments && options.attachments.length > 0);
    const routing = detectBestModelForPrompt(options.prompt, hasAttachments);
    const primaryTarget = routing.targetModel;
    const routingReason = routing.reason;

    // Fallback pipeline if primary target provider is busy or fails
    const fallbackCandidates = [
      primaryTarget,
      "qwen/qwen3.8-27b",
      "@cf/meta/llama-3.1-8b-instruct",
      "gemini-2.0-flash",
    ];

    const uniqueCandidates = Array.from(new Set(fallbackCandidates));
    let lastErr: any = null;

    for (const candidate of uniqueCandidates) {
      try {
        const res = await generateContentUniversal({
          ...options,
          model: candidate,
        });

        const modelDef = SUPPORTED_MODELS.find((m) => m.id === candidate);
        const autoHeader = `> ⚡ **Auto-Routed to ${modelDef?.displayName || candidate}** (${routingReason})\n\n`;

        return {
          text: autoHeader + res.text,
          modelUsed: `Auto (${modelDef?.displayName || candidate})`,
          tokensUsed: res.tokensUsed,
        };
      } catch (err: any) {
        lastErr = err;
        console.warn(`[Auto Router] Candidate '${candidate}' failed, testing next fallback...`, err.message);
      }
    }

    throw lastErr || new Error("All Auto Router models failed.");
  }

  const modelDef = resolveModelDefinition(modelId);
  const provider = modelDef?.provider || "Google";

  try {
    switch (provider) {
      case "Groq":
        return await callGroqCloud(modelId, options);
      case "OpenRouter":
        return await callOpenRouter(modelId, options);
      case "Mistral":
        return await callMistral(modelId, options);
      case "SambaNova":
        return await callSambaNova(modelId, options);
      case "Cloudflare":
        return await callCloudflare(modelId, options);
      case "xAI":
        return await callXAiGrok(modelId, options);
      case "OpenAI":
        return await callOpenAi(modelId, options);
      case "Anthropic":
        return await callAnthropic(modelId, options);
      case "DeepSeek":
        return await callDeepSeek(modelId, options);
      case "Google":
      default:
        return await callGoogleGemini(modelId, options);
    }
  } catch (error: any) {
    const rawMsg = error?.message || "Generation error occurred";
    const safeMsg = sanitizeErrorMessage(rawMsg);

    if (
      safeMsg.includes("high demand") ||
      safeMsg.includes("rate_limited") ||
      safeMsg.includes("Rate limit") ||
      safeMsg.includes("429")
    ) {
      throw new Error(
        `[${modelDef?.displayName || modelId}]: Provider is currently at peak capacity (Rate Limited). Please select 'Qwen 3.8 27B (Groq)' or 'Llama 3.1 8B (Cloudflare)' from the top dropdown for instant generation.`
      );
    }

    if (safeMsg.includes("credits") || safeMsg.includes("402")) {
      throw new Error(
        `[${modelDef?.displayName || modelId}]: Provider requires additional credits. Please switch to a free model like 'Qwen 3.8 27B (Groq)' or 'Llama 3.1 8B (Cloudflare)'.`
      );
    }

    throw new Error(`[${modelDef?.displayName || modelId}]: ${safeMsg}`);
  }
}

// -----------------------------------------------------------------
// 1. Google Gemini Provider
// -----------------------------------------------------------------
async function callGoogleGemini(
  modelId: string,
  options: GenerateModelOptions
): Promise<GenerateModelResult> {
  const apiKey = options.customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY to your .env.local file or enter it in the AI Settings dialog. (Free key: https://aistudio.google.com/apikey)"
    );
  }

  const modelToCall =
    modelId === "gemini-3.8-flash" || modelId === "gemini-1.5-flash"
      ? "gemini-2.0-flash"
      : modelId;

  // Primary: official GoogleGenAI SDK
  try {
    const ai = new GoogleGenAI({ apiKey });
    const contents: any[] = [];

    if (options.history && options.history.length > 0) {
      for (const msg of options.history) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    const currentParts: any[] = [];
    if (options.attachments && options.attachments.length > 0) {
      for (const att of options.attachments) {
        if (att.data) {
          const base64Data = att.data.includes(",")
            ? att.data.split(",")[1]
            : att.data;
          currentParts.push({
            inlineData: {
              mimeType: att.type || "application/octet-stream",
              data: base64Data,
            },
          });
        }
      }
    }

    currentParts.push({ text: options.prompt });
    contents.push({ role: "user", parts: currentParts });

    const config: any = {};
    if (options.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }

    const response = await ai.models.generateContent({
      model: modelToCall,
      contents,
      config,
    });

    return {
      text: response.text || "",
      modelUsed: modelToCall,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    };
  } catch (sdkErr: any) {
    // High-reliability direct REST API fallback
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToCall}:generateContent?key=${apiKey}`;

    const parts: any[] = [];
    if (options.attachments && options.attachments.length > 0) {
      for (const att of options.attachments) {
        if (att.data) {
          const base64Data = att.data.includes(",")
            ? att.data.split(",")[1]
            : att.data;
          parts.push({
            inline_data: {
              mime_type: att.type || "application/octet-stream",
              data: base64Data,
            },
          });
        }
      }
    }
    parts.push({ text: options.prompt });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || sdkErr?.message || "Google Gemini API error");
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return {
      text: reply,
      modelUsed: modelToCall,
      tokensUsed: data.usageMetadata?.totalTokenCount || 0,
    };
  }
}

// -----------------------------------------------------------------
// 2. xAI Grok Provider
// -----------------------------------------------------------------
async function callXAiGrok(
  modelId: string,
  options: GenerateModelOptions
): Promise<GenerateModelResult> {
  const apiKey = options.customApiKey || process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROK_API_KEY is not configured. Please add GROK_API_KEY to your .env.local file or enter it in the AI Settings dialog. (Get a key at https://console.x.ai/)"
    );
  }

  const messages: any[] = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  if (options.history) {
    options.history.forEach((h) => messages.push({ role: h.role, content: h.content }));
  }
  messages.push({ role: "user", content: options.prompt });

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "xAI Grok API error");
  }

  return {
    text: data.choices?.[0]?.message?.content || "",
    modelUsed: modelId,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

// -----------------------------------------------------------------
// 3. OpenAI Provider
// -----------------------------------------------------------------
async function callOpenAi(
  modelId: string,
  options: GenerateModelOptions
): Promise<GenerateModelResult> {
  const apiKey = options.customApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Please add OPENAI_API_KEY to your .env.local file or enter it in the AI Settings dialog. (Get a key at https://platform.openai.com/api-keys)"
    );
  }

  const messages: any[] = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  if (options.history) {
    options.history.forEach((h) => messages.push({ role: h.role, content: h.content }));
  }
  messages.push({ role: "user", content: options.prompt });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "OpenAI API error");
  }

  return {
    text: data.choices?.[0]?.message?.content || "",
    modelUsed: modelId,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

// -----------------------------------------------------------------
// 4. Anthropic Claude Provider
// -----------------------------------------------------------------
async function callAnthropic(
  modelId: string,
  options: GenerateModelOptions
): Promise<GenerateModelResult> {
  const apiKey = options.customApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Please add ANTHROPIC_API_KEY to your .env.local file or enter it in the AI Settings dialog. (Get a key at https://console.anthropic.com/settings/keys)"
    );
  }

  const messages: any[] = [];
  if (options.history) {
    options.history.forEach((h) => messages.push({ role: h.role, content: h.content }));
  }
  messages.push({ role: "user", content: options.prompt });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      max_tokens: 4096,
      system: options.systemInstruction || undefined,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Anthropic API error");
  }

  return {
    text: data.content?.[0]?.text || "",
    modelUsed: modelId,
    tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
  };
}

// -----------------------------------------------------------------
// 5. DeepSeek Provider
// -----------------------------------------------------------------
async function callDeepSeek(
  modelId: string,
  options: GenerateModelOptions
): Promise<GenerateModelResult> {
  const apiKey = options.customApiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY is not configured. Please add DEEPSEEK_API_KEY to your .env.local file or enter it in the AI Settings dialog. (Get a key at https://platform.deepseek.com/api_keys)"
    );
  }

  const messages: any[] = [];
  if (options.history) {
    options.history.forEach((h) => messages.push({ role: h.role, content: h.content }));
  }
  messages.push({ role: "user", content: options.prompt });

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "DeepSeek API error");
  }

  return {
    text: data.choices?.[0]?.message?.content || "",
    modelUsed: modelId,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

// -----------------------------------------------------------------
// 6. Groq Cloud Provider (Ultra-Fast LPUs)
// -----------------------------------------------------------------
async function callGroqCloud(
  modelId: string,
  options: GenerateModelOptions
): Promise<GenerateModelResult> {
  const apiKey = options.customApiKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not configured. Please add GROQ_API_KEY to your .env.local file or enter it in the AI Settings dialog. (Get a key at https://console.groq.com/keys)"
    );
  }

  const messages: any[] = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  if (options.history) {
    options.history.forEach((h) => messages.push({ role: h.role, content: h.content }));
  }
  messages.push({ role: "user", content: options.prompt });

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Groq Cloud API error");
  }

  // Handle models that return content or reasoning
  const msg = data.choices?.[0]?.message;
  const replyText = msg?.content || msg?.reasoning || "";

  return {
    text: replyText,
    modelUsed: modelId,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

// -----------------------------------------------------------------
// 7. OpenRouter Provider (Universal Routing Mesh)
// -----------------------------------------------------------------
async function callOpenRouter(
  modelId: string,
  options: GenerateModelOptions
): Promise<GenerateModelResult> {
  const apiKey = options.customApiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Please add OPENROUTER_API_KEY to your .env.local file or enter it in the AI Settings dialog. (Get a key at https://openrouter.ai/keys)"
    );
  }

  const messages: any[] = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  if (options.history) {
    options.history.forEach((h) => messages.push({ role: h.role, content: h.content }));
  }
  messages.push({ role: "user", content: options.prompt });

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "AI Super App",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "OpenRouter API error");
  }

  const msg = data.choices?.[0]?.message;
  const replyText = msg?.content || msg?.reasoning || "";

  return {
    text: replyText,
    modelUsed: modelId,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

// -----------------------------------------------------------------
// 8. Mistral AI Provider
// -----------------------------------------------------------------
async function callMistral(
  modelId: string,
  options: GenerateModelOptions
): Promise<GenerateModelResult> {
  const apiKey = options.customApiKey || process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error(
      "MISTRAL_API_KEY is not configured. Please add MISTRAL_API_KEY to your .env.local file or enter it in the AI Settings dialog. (Get a key at https://console.mistral.ai/)"
    );
  }

  const messages: any[] = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  if (options.history) {
    options.history.forEach((h) => messages.push({ role: h.role, content: h.content }));
  }
  messages.push({ role: "user", content: options.prompt });

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error?.message || "Mistral API error");
  }

  return {
    text: data.choices?.[0]?.message?.content || "",
    modelUsed: modelId,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

// -----------------------------------------------------------------
// 9. SambaNova Cloud Provider (SN40L RDUs)
// -----------------------------------------------------------------
async function callSambaNova(
  modelId: string,
  options: GenerateModelOptions
): Promise<GenerateModelResult> {
  const apiKey = options.customApiKey || process.env.SAMBANOVA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "SAMBANOVA_API_KEY is not configured. Please add SAMBANOVA_API_KEY to your .env.local file or enter it in the AI Settings dialog. (Get a key at https://cloud.sambanova.ai/)"
    );
  }

  const messages: any[] = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  if (options.history) {
    options.history.forEach((h) => messages.push({ role: h.role, content: h.content }));
  }
  messages.push({ role: "user", content: options.prompt });

  const res = await fetch("https://api.sambanova.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "SambaNova API error");
  }

  return {
    text: data.choices?.[0]?.message?.content || "",
    modelUsed: modelId,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

// -----------------------------------------------------------------
// 10. Cloudflare Workers AI Provider (Serverless Edge)
// -----------------------------------------------------------------
async function callCloudflare(
  modelId: string,
  options: GenerateModelOptions
): Promise<GenerateModelResult> {
  const token = options.customApiKey || process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "758282a3180d2da0cfb01744a6f98803";

  if (!token) {
    throw new Error(
      "CLOUDFLARE_API_TOKEN is not configured. Please add CLOUDFLARE_API_TOKEN to your .env.local file or enter it in the AI Settings dialog."
    );
  }

  const messages: any[] = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  if (options.history) {
    options.history.forEach((h) => messages.push({ role: h.role, content: h.content }));
  }
  messages.push({ role: "user", content: options.prompt });

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
      }),
    }
  );

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.errors?.[0]?.message || "Cloudflare Workers AI error");
  }

  return {
    text: data.result?.response || data.result?.choices?.[0]?.message?.content || "",
    modelUsed: modelId,
    tokensUsed: data.result?.usage?.total_tokens || 0,
  };
}

// Backwards compatibility alias for gemini-specific calls
export const generateGeminiContent = generateContentUniversal;
export function resolveModelId(id: string) { return id; }
