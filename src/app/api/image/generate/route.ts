import { NextRequest, NextResponse } from "next/server";
import { generateImage, IMAGE_MODELS } from "@/lib/image";
import { sanitizeErrorMessage } from "@/lib/gemini";
import { authenticateRequest } from "@/lib/server-auth";
import { reportProviderFailure } from "@/lib/monitoring";

const MAX_PROMPT_LENGTH = 2000;

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

    const result = await generateImage({
      prompt,
      model,
      steps: typeof steps === "number" ? steps : undefined,
      negativePrompt,
      customToken: req.headers.get("x-cloudflare-token") || undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    reportProviderFailure("Cloudflare (Image)", "text-to-image", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error?.message || "Image generation failed.") },
      { status: 500 }
    );
  }
}
