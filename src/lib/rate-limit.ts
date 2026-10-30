import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * In-memory fixed-window rate limiter.
 *
 * It exists to stop casual or accidental abuse of the free AI tiers (a runaway
 * client loop can drain a whole day's provider quota in minutes). It is scoped
 * to a single server instance — Vercel may run several — so treat it as a burst
 * guard, not a hard limit: the per-user credit system is the real cap. Swap in
 * Upstash Redis if you ever need globally accurate counting.
 *
 * Expired entries are purged lazily (no timers), which keeps it safe in
 * serverless runtimes.
 */

interface Window {
  count: number;
  windowStart: number;
}

const store = new Map<string, Window>();

/** Above this size, expired windows are swept to stop unbounded growth. */
const PURGE_THRESHOLD = 5000;

function purgeExpired(now: number, windowMs: number): void {
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart >= windowMs * 2) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/** Records a hit for `key` and reports whether it is still within the window. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  if (store.size > PURGE_THRESHOLD) purgeExpired(now, windowMs);

  const entry = store.get(`${key}:${limit}:${windowMs}`);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(`${key}:${limit}:${windowMs}`, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - entry.windowStart),
    };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, retryAfterMs: 0 };
}

/** Best-effort caller identity: the signed-in user, else the client IP. */
export function rateLimitIdentity(req: NextRequest, userId?: string): string {
  if (userId) return `u:${userId}`;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `ip:${ip}`;
}

/** Standard 429 response, including a `Retry-After` header. */
export function rateLimitedResponse(
  retryAfterMs: number,
  message?: string
): NextResponse {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return NextResponse.json(
    {
      error:
        message ||
        `Too many requests. Please wait ${seconds} second${seconds === 1 ? "" : "s"} and try again.`,
    },
    { status: 429, headers: { "Retry-After": String(seconds) } }
  );
}

/**
 * Convenience wrapper: enforces the limit and returns a ready-to-send 429
 * response when the caller has exceeded it, or `null` when the request may
 * continue.
 */
export function enforceRateLimit(
  req: NextRequest,
  options: { limit: number; windowMs: number; userId?: string; message?: string }
): NextResponse | null {
  const { limit, windowMs, userId, message } = options;
  const result = rateLimit(rateLimitIdentity(req, userId), limit, windowMs);
  return result.allowed ? null : rateLimitedResponse(result.retryAfterMs, message);
}
