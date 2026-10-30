import { NextRequest, NextResponse } from "next/server";
import { editImage } from "@/lib/image";
import { sanitizeErrorMessage } from "@/lib/gemini";
import { authenticateRequest } from "@/lib/server-auth";
import { reportProviderFailure } from "@/lib/monitoring";

const MAX_PROMPT_LENGTH = 2000;
/** The source image must be <= 10 MB (data URL length is ~1.37x the bytes). */
const MAX_IMAGE_DATA_LENGTH = 14 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { prompt, image, steps, negativePrompt } = body || {};

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

    const result = await editImage({
      prompt,
      image,
      steps: typeof steps === "number" ? steps : undefined,
      negativePrompt,
      customToken: req.headers.get("x-cloudflare-token") || undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    reportProviderFailure("Cloudflare (Image)", "image-to-image", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error?.message || "Image editing failed.") },
      { status: 500 }
    );
  }
}
