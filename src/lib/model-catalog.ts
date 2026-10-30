import { adminDb } from "@/lib/firebase/admin";
import { SUPPORTED_MODELS, type ModelDefinition, type ModelProvider } from "@/lib/models";

/**
 * Server-side model catalogue.
 *
 * The built-in list in `lib/models.ts` is the default. Admins may override any
 * built-in entry or add brand-new models; those live in the Firestore
 * `aiModels` collection (public read, server-only write). This module merges
 * the two so both the public API and the chat route see one authoritative list.
 */

export interface StoredModel extends ModelDefinition {
  /** Hidden from the model picker when false. */
  enabled: boolean;
  /** True for models that do not exist in the built-in catalogue. */
  isCustom: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const CACHE_TTL_MS = 60_000;
let cache: { at: number; models: ModelDefinition[] } | null = null;

function toProvider(value: unknown): ModelProvider {
  return (value || "Google") as ModelProvider;
}

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Normalises a Firestore record into a full, typed model definition. */
function coerce(record: Record<string, unknown>, fallbackId: string): ModelDefinition {
  return {
    id: String(record.id || fallbackId),
    displayName: String(record.displayName || fallbackId),
    provider: toProvider(record.provider),
    badge: String(record.badge || ""),
    cost: toNumber(record.cost, 1),
    description: String(record.description || ""),
    maxTokens: toNumber(record.maxTokens, 32768),
    isPopular: record.isPopular === true,
  };
}

function toDefinition(model: StoredModel): ModelDefinition {
  return {
    id: model.id,
    displayName: model.displayName,
    provider: model.provider,
    badge: model.badge,
    cost: model.cost,
    description: model.description,
    maxTokens: model.maxTokens,
    isPopular: model.isPopular,
  };
}

/**
 * Every model — enabled or not — with admin overrides applied.
 * Used by the admin console, so it always reads fresh data.
 */
export async function loadAllModels(): Promise<StoredModel[]> {
  const overrides = new Map<string, StoredModel>();
  const db = adminDb();

  if (db) {
    try {
      const snap = await db.collection("aiModels").get();
      snap.forEach((doc) => {
        const data = (doc.data() || {}) as Record<string, unknown>;
        overrides.set(doc.id, {
          ...coerce(data, doc.id),
          enabled: data.enabled !== false,
          isCustom: data.isCustom === true,
          createdAt: typeof data.createdAt === "string" ? data.createdAt : undefined,
          updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined,
        });
      });
    } catch (err) {
      console.warn("[ModelCatalog] Could not read aiModels from Firestore:", err);
    }
  }

  const result: StoredModel[] = [];

  for (const def of SUPPORTED_MODELS) {
    const override = overrides.get(def.id);
    if (override) {
      overrides.delete(def.id);
      result.push(override);
    } else {
      result.push({ ...def, enabled: true, isCustom: false });
    }
  }

  // Anything left is a model the admin added.
  for (const custom of overrides.values()) result.push(custom);

  return result;
}

/** Models currently visible in the picker (enabled only), memoised for a minute. */
export async function getEnabledModels(force = false): Promise<ModelDefinition[]> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.models;

  const all = await loadAllModels();
  const models = all.filter((m) => m.enabled).map(toDefinition);
  cache = { at: Date.now(), models };
  return models;
}

/** Called after an admin write so the change is visible immediately. */
export function invalidateModelCache(): void {
  cache = null;
}

/** True when `id` matches a built-in (i.e. an edit rather than a new model). */
export function isBuiltInModel(id: string): boolean {
  return SUPPORTED_MODELS.some((m) => m.id === id);
}
