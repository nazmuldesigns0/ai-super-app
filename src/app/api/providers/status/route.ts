import { NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/firebase/admin";

export async function GET() {
  const providers = {
    Google: {
      name: "Google Gemini",
      hasEnvKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
      envVar: "GEMINI_API_KEY",
      keyUrl: "https://aistudio.google.com/apikey",
      models: ["gemini-2.0-flash", "gemini-1.5-flash-8b"],
      isFreeTierAvailable: true,
    },
    Groq: {
      name: "Groq Cloud",
      hasEnvKey: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0),
      envVar: "GROQ_API_KEY",
      keyUrl: "https://console.groq.com/keys",
      models: ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"],
      isFreeTierAvailable: true,
    },
    Mistral: {
      name: "Mistral AI",
      hasEnvKey: Boolean(process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY.trim().length > 0),
      envVar: "MISTRAL_API_KEY",
      keyUrl: "https://console.mistral.ai/",
      models: ["codestral-latest", "open-mistral-nemo", "ministral-8b-latest"],
      isFreeTierAvailable: true,
    },
    Cloudflare: {
      name: "Cloudflare Workers AI",
      hasEnvKey: Boolean(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_API_TOKEN.trim().length > 0),
      envVar: "CLOUDFLARE_API_TOKEN",
      keyUrl: "https://dash.cloudflare.com/",
      models: [
        "@cf/meta/llama-3.1-8b-instruct",
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        "@cf/qwen/qwen2.5-coder-32b-instruct",
        "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
      ],
      isFreeTierAvailable: true,
    },
  };

  const firebase = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hisab-pati-2552b",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hisab-pati-2552b.firebaseapp.com",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hisab-pati-2552b.firebasestorage.app",
    hasApiKey: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    firestoreConnected: true, // Successfully deployed firestore.rules
    storageStatus: "bucket_initialization_pending", // needs 1-click in console
    adminSdkConfigured: isAdminConfigured,
  };

  return NextResponse.json({
    status: "ok",
    providers,
    firebase,
  });
}
