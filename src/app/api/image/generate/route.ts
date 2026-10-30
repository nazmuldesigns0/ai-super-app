import { NextRequest, NextResponse } from "next/server";
import { generateImage, IMAGE_MODELS } from "@/lib/image";
import { sanitizeErrorMessage } from "@/lib/gemini";
import { authenticateRequest, requireVerifiedEmail } from "@/lib/server-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { reportProviderFailure } from "@/lib/monitoring";
import { adminDb } from "@/lib/firebase/admin";
import { chargeCredits, getCreditBalance } from "@/lib/credits";
import { CREDIT_COSTS, UNLIMITED_CREDITS } from "@/lib/plans";

const MAX_PROMPT_LENGTH = 2000;

/** Image generations allowed per user per minute. */
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/** GET /api/image/generate — list available (free) image models. */
export async function GET() {
  return NextResponse.json({
    models: IMAGE_MODELS.filter((m) => m.task === "text-to-image").map((m) => ({
      id: m.id,
      displayName: m.displayName,
      badge: m.badge,
      description: m.description,
      defaultSteps: m.defaultSteps,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const rateLimited = enforceRateLimit(req, {
      limit: RATE_LIMIT_MAX,
      windowMs: RATE_LIMIT_WINDOW_MS,
      userId: auth.userId,
    });
    if (rateLimited) return rateLimited;

    const unverified = requireVerifiedEmail(auth);
    if (unverified) return unverified;

    const body = await req.json().catch(() => ({}));
    const { prompt, model, steps, negativePrompt } = body || {};

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt is too long. Maximum ${MAX_PROMPT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const cost = CREDIT_COSTS.imageGenerate;

    // ── Credit check ──────────────────────────────────────────────────
    const db = adminDb();
    const balance = auth.isAdmin ? UNLIMITED_CREDITS : await getCreditBalance(db, auth.userId);
    if (balance !== null && balance !== UNLIMITED_CREDITS && balance < cost) {
      return NextResponse.json(
        {
          error: `Insufficient credits. Image generation costs ${cost} credits, but you have ${balance}. Upgrade your package to continue.`,
          code: "INSUFFICIENT_CREDITS",
          cost,
          creditBalance: balance,
        },
        { status: 403 }
      );
    }

    const result = await generateImage({
      prompt,
      model,
      steps: typeof steps === "number" ? steps : undefined,
      negativePrompt,
      customToken: req.headers.get("x-cloudflare-token") || undefined,
    });

    // Atomically deduct credits (admins are never charged).
    const charge = await chargeCredits({
      db,
      userId: auth.userId,
      cost,
      isAdmin: auth.isAdmin,
      description: `Image generation${model ? ` (${model})` : ""}`,
      metadata: { kind: "image_generate", model },
    });

    return NextResponse.json({
      ...result,
      cost,
      creditBalance: charge.unlimited ? UNLIMITED_CREDITS : charge.balance,
    });
  } catch (error: any) {
    reportProviderFailure("Cloudflare (Image)", "text-to-image", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error?.message || "Image generation failed.") },
      { status: 500 }
    );
  }
}
