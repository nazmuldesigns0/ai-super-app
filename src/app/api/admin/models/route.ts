import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/server-auth";
import { adminDb } from "@/lib/firebase/admin";
import { MODEL_PROVIDERS, type ModelProvider } from "@/lib/models";
import { invalidateModelCache, isBuiltInModel, loadAllModels } from "@/lib/model-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin-only management of the AI model catalogue (Firestore `aiModels`). */

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

async function requireAdmin(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth || !auth.isAdmin) return null;
  return auth;
}

/** GET /api/admin/models — every model, including disabled ones. */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const models = await loadAllModels();
  return NextResponse.json({ models });
}

/** POST /api/admin/models — create a new model or update an existing one. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const db = adminDb();
  if (!db) {
    return NextResponse.json({ error: "Admin database is unavailable." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const displayName = String(body?.displayName || "").trim();
  const provider = String(body?.provider || "") as ModelProvider;
  const badge = String(body?.badge || "").trim();
  const description = String(body?.description || "").trim();
  const cost = Number(body?.cost);
  const maxTokens = Number(body?.maxTokens);
  const isPopular = body?.isPopular === true;
  const enabled = body?.enabled !== false;

  let id = String(body?.id || "").trim();

  if (!displayName || displayName.length > 120) {
    return badRequest("Display name is required (max 120 characters).");
  }
  if (!MODEL_PROVIDERS.includes(provider)) {
    return badRequest("Choose a valid provider.");
  }
  if (!Number.isFinite(cost) || cost < 1 || cost > 50) {
    return badRequest("Cost must be between 1 and 50 credits.");
  }
  if (!Number.isFinite(maxTokens) || maxTokens < 256 || maxTokens > 2_000_000) {
    return badRequest("Max tokens must be between 256 and 2,000,000.");
  }
  if (badge.length > 40) return badRequest("Badge is too long (max 40 characters).");
  if (description.length > 300) {
    return badRequest("Description is too long (max 300 characters).");
  }

  if (!id) {
    // New model: default the id from the display name; the admin can change it.
    id = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  }

  if (!/^[A-Za-z0-9@._:/-]{2,120}$/.test(id)) {
    return badRequest(
      "Model ID may only contain letters, numbers and - _ . / : @ (2–120 characters)."
    );
  }

  const now = new Date().toISOString();
  const record = {
    id,
    displayName,
    provider,
    badge,
    cost,
    description,
    maxTokens,
    isPopular,
    enabled,
    isCustom: !isBuiltInModel(id),
    updatedAt: now,
  };

  try {
    const ref = db.collection("aiModels").doc(id);
    const existing = await ref.get();
    // Keep the original createdAt when editing an existing model.
    await ref.set(existing.exists ? record : { ...record, createdAt: now }, { merge: true });
    invalidateModelCache();
    return NextResponse.json({ success: true, model: record });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not save the model." },
      { status: 500 }
    );
  }
}

/** DELETE /api/admin/models?id=… — remove an override (reverts built-ins). */
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) return badRequest("A model id is required.");

  const db = adminDb();
  if (!db) {
    return NextResponse.json({ error: "Admin database is unavailable." }, { status: 503 });
  }

  try {
    await db.collection("aiModels").doc(id).delete();
    invalidateModelCache();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not delete the model." },
      { status: 500 }
    );
  }
}
