import { NextRequest, NextResponse } from "next/server";
import { generateGeminiContent, SUPPORTED_MODELS, sanitizeErrorMessage } from "@/lib/gemini";
import { generateAI } from "@/lib/ai";
import { reportProviderFailure } from "@/lib/monitoring";
import { authenticateRequest, resolveUserScope } from "@/lib/server-auth";
import { adminDb } from "@/lib/firebase/admin";
import type { Attachment } from "@/types";
import { v4 as uuidv4 } from "uuid";

// ── Constants ────────────────────────────────────────────────────────────────
/** Maximum file size allowed per attachment (10 MB) */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Maximum number of characters allowed in a single prompt */
const MAX_PROMPT_LENGTH = 10_000;

/** Max requests per user per window */
const RATE_LIMIT_MAX = 30;

/** Rate-limit window in milliseconds (60 seconds) */
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// ── In-memory Rate Limiter ────────────────────────────────────────────────────
// Simple sliding-window counter keyed by userId (or IP for unauthenticated).
// For production scale use Upstash Redis instead.
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

// Periodically clean up expired entries to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS * 5);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      model = "gemini-3.8-flash",
      sessionId: existingSessionId,
      userId: requestedUserId,
      history = [],
      attachments = [],
      isArenaMode = false,
      modelB = "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      customApiKeys = {},
    } = body;

    // ── Authentication & Authorization ────────────────────────────────
    // The user id is derived from a verified Firebase ID token; a client
    // can never act as another account by sending a crafted `userId`.
    const auth = await authenticateRequest(req);
    const scope = resolveUserScope(auth, requestedUserId);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.error }, { status: 401 });
    }
    const userId = scope.userId;

    // ── Rate Limiting ─────────────────────────────────────────────────
    // Key by userId if authenticated, else fall back to IP
    const rateLimitKey =
      userId ||
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "anonymous";
    const { allowed, retryAfterMs } = checkRateLimit(String(rateLimitKey));
    if (!allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. You can send up to ${RATE_LIMIT_MAX} requests per minute. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }

    // ── Input Validation ──────────────────────────────────────────────
    if (message && typeof message === "string" && message.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        {
          error: `Prompt is too long (${message.length.toLocaleString()} characters). Maximum allowed is ${MAX_PROMPT_LENGTH.toLocaleString()} characters.`,
        },
        { status: 400 }
      );
    }

    const getProviderKey = (provider: string): string | undefined => {
      if (customApiKeys[provider]) return customApiKeys[provider];
      if (provider === "Google") return req.headers.get("x-gemini-key") || undefined;
      if (provider === "Groq") return req.headers.get("x-groq-key") || undefined;
      if (provider === "OpenRouter") return req.headers.get("x-openrouter-key") || undefined;
      if (provider === "Mistral") return req.headers.get("x-mistral-key") || undefined;
      if (provider === "SambaNova") return req.headers.get("x-sambanova-key") || undefined;
      if (provider === "Cloudflare") return req.headers.get("x-cloudflare-token") || undefined;
      if (provider === "HuggingFace") return req.headers.get("x-huggingface-key") || undefined;
      if (provider === "xAI") return req.headers.get("x-grok-key") || undefined;
      if (provider === "OpenAI") return req.headers.get("x-openai-key") || undefined;
      if (provider === "Anthropic") return req.headers.get("x-anthropic-key") || undefined;
      if (provider === "DeepSeek") return req.headers.get("x-deepseek-key") || undefined;
      return undefined;
    };

    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: "A message prompt or at least one attachment is required." },
        { status: 400 }
      );
    }

    // Server-side file validation (Max 10MB per file)
    if (attachments && attachments.length > 0) {
      for (const file of attachments as Attachment[]) {
        if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            {
              error: `File "${file.name}" exceeds the maximum allowed size of 10MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
            },
            { status: 400 }
          );
        }
      }
    }

    const sessionId = existingSessionId || uuidv4();
    const db = adminDb();

    // Check credits if authenticated with admin DB
    let currentBalance: number | null = null;
    const modelAConfig = SUPPORTED_MODELS.find((m) => m.id === model) || SUPPORTED_MODELS[0];
    const modelBConfig = SUPPORTED_MODELS.find((m) => m.id === modelB) || SUPPORTED_MODELS[2];
    const totalCost = isArenaMode
      ? modelAConfig.cost + modelBConfig.cost
      : modelAConfig.cost;

    if (db && userId) {
      try {
        const userRef = db.collection("users").doc(userId);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
          const userData = userSnap.data();
          currentBalance = userData?.creditBalance ?? 0;
          if (currentBalance !== null && currentBalance < totalCost) {
            return NextResponse.json(
              {
                error: `Insufficient credits. You need ${totalCost} credits, but you have ${currentBalance}.`,
                creditBalance: currentBalance,
              },
              { status: 403 }
            );
          }
        }
      } catch (err) {
        console.warn("Could not check user credits from Firestore:", err);
      }
    }

    // Call Model A
    const promptText = message || "Please analyze the uploaded document/image in detail.";

    if (isArenaMode) {
      // Arena mode: Run Model A and Model B concurrently
      const [resA, resB] = await Promise.allSettled([
        generateGeminiContent({
          model,
          prompt: promptText,
          history,
          attachments,
          customApiKey: getProviderKey(modelAConfig.provider),
        }),
        generateGeminiContent({
          model: modelB,
          prompt: promptText,
          history,
          attachments,
          customApiKey: getProviderKey(modelBConfig.provider),
        }),
      ]);

      const outputA =
        resA.status === "fulfilled"
          ? resA.value
          : (reportProviderFailure(
              modelAConfig.provider,
              model,
              (resA as PromiseRejectedResult).reason,
              userId
            ),
            {
              text: `[${model} Error: ${(resA as PromiseRejectedResult).reason?.message || "Generation failed"}]`,
              modelUsed: model,
              tokensUsed: 0,
            });

      const outputB =
        resB.status === "fulfilled"
          ? resB.value
          : (reportProviderFailure(
              modelBConfig.provider,
              modelB,
              (resB as PromiseRejectedResult).reason,
              userId
            ),
            {
              text: `[${modelB} Error: ${(resB as PromiseRejectedResult).reason?.message || "Generation failed"}]`,
              modelUsed: modelB,
              tokensUsed: 0,
            });

      // Background persist & credit deduct
      await persistChatAndCredits({
        db,
        userId,
        sessionId,
        prompt: promptText,
        attachments,
        modelA: outputA.modelUsed,
        contentA: outputA.text,
        tokensA: outputA.tokensUsed,
        modelB: outputB.modelUsed,
        contentB: outputB.text,
        cost: totalCost,
        isArena: true,
      });

      return NextResponse.json({
        sessionId,
        role: "assistant",
        content: outputA.text,
        model: outputA.modelUsed,
        tokensUsed: (outputA.tokensUsed || 0) + (outputB.tokensUsed || 0),
        comparison: {
          modelB: outputB.modelUsed,
          contentB: outputB.text,
        },
        cost: totalCost,
        creditBalance:
          currentBalance !== null ? Math.max(0, currentBalance - totalCost) : undefined,
      });
    }

    // Standard Single-Model Mode (with automatic provider failover)
    const output = await generateAI({
      model,
      prompt: promptText,
      history,
      attachments,
      customApiKey: getProviderKey(modelAConfig.provider),
    });

    // Background persist & credit deduct
    await persistChatAndCredits({
      db,
      userId,
      sessionId,
      prompt: promptText,
      attachments,
      modelA: output.modelUsed,
      contentA: output.text,
      tokensA: output.tokensUsed,
      cost: totalCost,
      isArena: false,
    });

    return NextResponse.json({
      sessionId,
      role: "assistant",
      content: output.text,
      model: output.modelUsed,
      tokensUsed: output.tokensUsed || 0,
      cost: totalCost,
      creditBalance:
        currentBalance !== null ? Math.max(0, currentBalance - totalCost) : undefined,
    });
  } catch (error: any) {
    console.error("API /api/chat error:", error);
    const safeError = sanitizeErrorMessage(error?.message || "An unexpected error occurred while communicating with AI provider.");
    return NextResponse.json(
      {
        error: safeError,
      },
      { status: 500 }
    );
  }
}

/**
 * Persists messages, updates user session, logs credit transaction, and registers attachments in Library
 */
async function persistChatAndCredits(opts: {
  db: FirebaseFirestore.Firestore | null;
  userId?: string;
  sessionId: string;
  prompt: string;
  attachments?: Attachment[];
  modelA: string;
  contentA: string;
  tokensA?: number;
  modelB?: string;
  contentB?: string;
  cost: number;
  isArena: boolean;
}) {
  const { db, userId, sessionId, prompt, attachments, modelA, contentA, tokensA, modelB, contentB, cost, isArena } = opts;
  if (!db || !userId) return;

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const batch = db.batch();

    // 1. Ensure chat session exists
    const sessionRef = db.collection("chatSessions").doc(sessionId);
    batch.set(
      sessionRef,
      {
        id: sessionId,
        userId,
        title: prompt.slice(0, 45) + (prompt.length > 45 ? "..." : ""),
        model: modelA,
        updatedAt: now,
      },
      { merge: true }
    );

    // 2. Add user message
    const userMsgRef = db.collection("messages").doc(uuidv4());
    batch.set(userMsgRef, {
      id: userMsgRef.id,
      sessionId,
      role: "user",
      content: prompt,
      attachments: attachments || [],
      createdAt: now,
    });

    // 3. Add assistant message
    const assistantMsgRef = db.collection("messages").doc(uuidv4());
    batch.set(assistantMsgRef, {
      id: assistantMsgRef.id,
      sessionId,
      role: "assistant",
      content: contentA,
      model: modelA,
      tokensUsed: tokensA || 0,
      comparison: isArena
        ? {
            modelB: modelB || "",
            contentB: contentB || "",
          }
        : null,
      createdAt: now,
    });

    // 4. Save any uploaded attachments to libraryFiles with 30-day expiration
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        const fileRef = db.collection("libraryFiles").doc(uuidv4());
        batch.set(fileRef, {
          id: fileRef.id,
          userId,
          name: att.name || "Uploaded File",
          fileType: att.type || "application/octet-stream",
          storagePath: `users/${userId}/chat/${fileRef.id}`,
          publicUrl: att.url || att.data || "",
          sizeBytes: att.size || 0,
          source: "chat",
          expiresAt, // 30-day lifecycle auto-delete marker
          createdAt: now,
        });
      }
    }

    // 5. Deduct credits & record transaction
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      const current = userSnap.data()?.creditBalance ?? 100;
      batch.update(userRef, {
        creditBalance: Math.max(0, current - cost),
        updatedAt: now,
      });

      const txRef = db.collection("creditTransactions").doc(uuidv4());
      batch.set(txRef, {
        id: txRef.id,
        userId,
        amount: -cost,
        type: "usage",
        description: `Chat request with ${modelA}${isArena ? ` vs ${modelB}` : ""}`,
        metadata: { sessionId, isArena, modelA, modelB },
        createdAt: now,
      });
    }

    await batch.commit();
  } catch (err) {
    console.error("Failed to persist chat session/credits to Firestore:", err);
  }
}
