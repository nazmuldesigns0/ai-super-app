import { NextRequest, NextResponse } from "next/server";
import { editImage } from "@/lib/image";
import { generateAI } from "@/lib/ai";
import { sanitizeErrorMessage } from "@/lib/gemini";
import { authenticateRequest, requireVerifiedEmail } from "@/lib/server-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { reportProviderFailure } from "@/lib/monitoring";
import { adminDb } from "@/lib/firebase/admin";
import { chargeCredits, getCreditBalance } from "@/lib/credits";
import { CREDIT_COSTS, UNLIMITED_CREDITS } from "@/lib/plans";

const MAX_PROMPT_LENGTH = 2000;
/** The source image must be <= 10 MB (data URL length is ~1.37x the bytes). */
const MAX_IMAGE_DATA_LENGTH = 14 * 1024 * 1024;

/** Image edits allowed per user per minute. */
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  const getProviderKey = (provider: string): string | undefined => {
    if (provider === "Google") return req.headers.get("x-gemini-key") || undefined;
    if (provider === "Cloudflare") return req.headers.get("x-cloudflare-token") || undefined;
    return undefined;
  };

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
    const { prompt, image, steps, strength, negativePrompt } = body || {};

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt is too long. Maximum ${MAX_PROMPT_LENGTH} characters.` },
        { status: 400 }
      );
    }
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "A source image is required." }, { status: 400 });
    }
    if (image.length > MAX_IMAGE_DATA_LENGTH) {
      return NextResponse.json(
        { error: "Source image is too large. Maximum 10 MB." },
        { status: 400 }
      );
    }

    const cost = CREDIT_COSTS.imageEdit;

    // ── AI-Assisted Prompt Engineering ────────────────────────────────
    // Use Gemini Vision to describe the image so the generative model 
    // preserves the original subject and features perfectly.
    let finalPrompt = prompt;
    try {
      const visionResult = await generateAI({
        model: "gemini-2.0-flash",
        prompt: `Analyze this image and provide a concise, highly detailed technical description of the main subject (person/object), their specific features, colors, and the environment. Focus on identifying markers that MUST remain identical (e.g., age, gender, facial structure, specific clothing colors). Then, output only a comma-separated list of these descriptive tags.`,
        attachments: [{ 
          data: image, 
          type: "image/png", 
          name: "source.png",
          url: "", // Not used server-side for inline data
          size: image.length
        }],
        customApiKey: getProviderKey("Google"),
      });

      if (visionResult?.text) {
        // Remove the auto-routed header if present
        const cleanVisionText = visionResult.text.split("\n\n").pop() || "";
        finalPrompt = `Photorealistic enhancement, ${prompt}. Source image features: ${cleanVisionText}. Preserve subject identity perfectly, high resolution, sharp focus, 8k, professional photography.`;
      }
    } catch (err) {
      console.warn("Gemini vision assistance failed for enhancement, falling back to raw prompt:", err);
    }

    // ── Credit check ──────────────────────────────────────────────────
    const db = adminDb();
    const balance = auth.isAdmin ? UNLIMITED_CREDITS : await getCreditBalance(db, auth.userId);
    if (balance !== null && balance !== UNLIMITED_CREDITS && balance < cost) {
      return NextResponse.json(
        {
          error: `Insufficient credits. Image editing costs ${cost} credits, but you have ${balance}. Upgrade your package to continue.`,
          code: "INSUFFICIENT_CREDITS",
          cost,
          creditBalance: balance,
        },
        { status: 403 }
      );
    }

    const result = await editImage({
      prompt: finalPrompt,
      image,
      steps: typeof steps === "number" ? steps : undefined,
      strength: typeof strength === "number" ? strength : 0.35, // Low strength preserves the original image
      negativePrompt,
      customToken: req.headers.get("x-cloudflare-token") || undefined,
    });

    // Atomically deduct credits (admins are never charged).
    const charge = await chargeCredits({
      db,
      userId: auth.userId,
      cost,
      isAdmin: auth.isAdmin,
      description: "Image edit",
      metadata: { kind: "image_edit" },
    });

    return NextResponse.json({
      ...result,
      cost,
      creditBalance: charge.unlimited ? UNLIMITED_CREDITS : charge.balance,
    });
  } catch (error: any) {
    reportProviderFailure("Cloudflare (Image)", "image-to-image", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error?.message || "Image editing failed.") },
      { status: 500 }
    );
  }
}
