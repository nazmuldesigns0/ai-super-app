import { sanitizeErrorMessage } from "@/lib/gemini";

/**
 * Free image services powered by Cloudflare Workers AI.
 * Both text-to-image and image-to-image run on Cloudflare's free daily allowance.
 */
export type ImageTaskType = "text-to-image" | "image-to-image";

export interface ImageModelDefinition {
  id: string;
  displayName: string;
  task: ImageTaskType;
  badge: string;
  description: string;
  /** Cloudflare image models use `num_steps` (flux) or `steps` (SDXL/img2img). */
  stepsParam: "steps" | "num_steps";
  defaultSteps: number;
  supportsNegativePrompt?: boolean;
}

export const IMAGE_MODELS: ImageModelDefinition[] = [
  {
    id: "@cf/black-forest-labs/flux-1-schnell",
    displayName: "FLUX.1 Schnell",
    task: "text-to-image",
    badge: "Best Quality",
    description: "State-of-the-art fast image generation by Black Forest Labs. Free on Cloudflare.",
    stepsParam: "steps",
    defaultSteps: 4,
  },
  {
    id: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    displayName: "Stable Diffusion XL",
    task: "text-to-image",
    badge: "Classic",
    description: "Stability AI's SDXL base model. Great for artistic and photographic prompts.",
    stepsParam: "steps",
    defaultSteps: 20,
    supportsNegativePrompt: true,
  },
  {
    id: "@cf/black-forest-labs/flux-2-klein-4b",
    displayName: "FLUX.2 Klein (Image Editing)",
    task: "image-to-image",
    badge: "Editing",
    description: "Transform an existing image using a text prompt (restyle, enhance, edit). Free on Cloudflare.",
    stepsParam: "steps",
    defaultSteps: 4,
  },
];

export interface GeneratedImage {
  image: string; // data URL (data:image/png;base64,...)
  model: string;
  modelName: string;
}

function getCloudflareCreds(customToken?: string) {
  const token = customToken || process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token) {
    throw new Error(
      "CLOUDFLARE_API_TOKEN is not configured. Add it to .env.local to enable free image generation."
    );
  }
  if (!accountId) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID is not configured. Add it to .env.local to enable free image generation."
    );
  }
  return { token, accountId };
}

/** Converts a base64 or data-URL string into a plain base64 payload. */
function toBase64(image: string): string {
  return image.includes(",") ? image.split(",")[1] : image;
}

/** Extracts a data URL from either a binary image response or a JSON body. */
async function parseImageResponse(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.startsWith("image/")) {
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok || (data && data.success === false)) {
    const message =
      data?.errors?.[0]?.message || data?.error?.message || "Image generation failed";
    throw new Error(message);
  }

  // flux returns { result: { image: "<base64>" } }
  const b64: string | undefined =
    data?.result?.image || data?.image || data?.result?.images?.[0];
  if (!b64) {
    throw new Error("The image provider returned an unexpected response.");
  }
  return b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
}

export interface GenerateImageOptions {
  prompt: string;
  model?: string;
  steps?: number;
  negativePrompt?: string;
  customToken?: string;
}

/** Free text-to-image generation. */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GeneratedImage> {
  const { token, accountId } = getCloudflareCreds(options.customToken);
  const modelDef =
    IMAGE_MODELS.find((m) => m.id === options.model && m.task === "text-to-image") ||
    IMAGE_MODELS[0];

  const body: Record<string, unknown> = { prompt: options.prompt };
  body[modelDef.stepsParam] = options.steps || modelDef.defaultSteps;
  if (options.negativePrompt && modelDef.supportsNegativePrompt) {
    body.negative_prompt = options.negativePrompt;
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelDef.id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
  } catch (err) {
    throw new Error(
      `Could not reach the image provider. ${sanitizeErrorMessage(
        err instanceof Error ? err.message : String(err)
      )}`
    );
  }

  const image = await parseImageResponse(res);
  return { image, model: modelDef.id, modelName: modelDef.displayName };
}

export interface EditImageOptions {
  prompt: string;
  image: string; // base64 or data URL of the source image
  model?: string;
  steps?: number;
  strength?: number;
  negativePrompt?: string;
  customToken?: string;
}

/** Free image-to-image editing (restyle / transform an existing image). */
export async function editImage(options: EditImageOptions): Promise<GeneratedImage> {
  const { token, accountId } = getCloudflareCreds(options.customToken);
  const modelDef =
    IMAGE_MODELS.find((m) => m.task === "image-to-image") || IMAGE_MODELS[2];

  // The image editors expect multipart/form-data with an `input_image` file.
  const bytes = Buffer.from(toBase64(options.image), "base64");
  const form = new FormData();
  form.append("prompt", options.prompt);
  form.append(
    "input_image",
    new Blob([bytes], { type: "image/png" }),
    "input.png"
  );
  
  // Add strength if provided (Cloudflare SDXL img2img supports this)
  if (options.strength !== undefined) {
    form.append("strength", options.strength.toString());
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelDef.id}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }
    );
  } catch (err) {
    throw new Error(
      `Could not reach the image provider. ${sanitizeErrorMessage(
        err instanceof Error ? err.message : String(err)
      )}`
    );
  }

  const image = await parseImageResponse(res);
  return { image, model: modelDef.id, modelName: modelDef.displayName };
}
