/**
 * Canonical, deployment-aware base URL. Overridable via NEXT_PUBLIC_APP_URL so
 * preview/staging deployments can advertise their own origin.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://ai-super-app-nazmul23.vercel.app"
).replace(/\/$/, "");

/**
 * Public, client-safe site metadata. Brand name, tagline and the support
 * address that is shown to users across the app.
 */
export const SITE = {
  name: "Nexora AI",
  shortName: "Nexora",
  tagline: "Create • Chat • Imagine",
  description:
    "Nexora AI is an all-in-one studio for AI chat, image generation, image editing and creative media tools.",
  supportEmail: "nazmuldesigns0@gmail.com",
  libraryRetentionDays: 30,
  maxUploadMb: 10,
  url: SITE_URL,
} as const;
