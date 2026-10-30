import type { NextRequest } from "next/server";
import { adminAuth, isAdminConfigured } from "@/lib/firebase/admin";

/** UID used by the built-in demo/sandbox session. */
export const DEMO_UID = "demo-admin-uid-123";

/**
 * Demo mode keeps the app usable without a real Firebase session (local dev,
 * preview, the "demo@gmail.com" login). It can be disabled in production by
 * setting DEMO_MODE_ALLOWED=false.
 */
export const isDemoModeAllowed = process.env.DEMO_MODE_ALLOWED !== "false";

export interface AuthContext {
  /** The user id the request is allowed to act as. Always server-derived. */
  userId: string;
  email?: string;
  /** True when a Firebase ID token was present and verified. */
  verified: boolean;
  /** True for the shared demo session (unverified). */
  isDemo: boolean;
  isAdmin: boolean;
}

/**
 * Last-resort decoder used ONLY in non-production environments when the Admin
 * SDK is not configured (no service account) so local development with a real
 * Firebase client still works. The token is NOT verified here.
 */
function decodeUnverifiedJwt(
  token: string
): { uid?: string; email?: string } | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const json = Buffer.from(
      payloadPart.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    const payload = JSON.parse(json);
    return { uid: payload.user_id || payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

/**
 * Resolves the caller's identity from a Firebase ID token.
 *
 * Resolution order:
 *  1. `Authorization: Bearer <idToken>` -> verified with the Admin SDK.
 *  2. Token present but Admin SDK not configured -> unverified decode, dev only.
 *  3. No token -> demo/anonymous fallback, only when demo mode is allowed.
 *
 * Returns `null` when the request must be rejected (bad token, or no token and
 * demo mode disabled).
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<AuthContext | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";

  if (token) {
    const auth = adminAuth();
    if (auth) {
      try {
        const decoded = await auth.verifyIdToken(token);
        return {
          userId: decoded.uid,
          email: decoded.email,
          verified: true,
          isDemo: decoded.uid === DEMO_UID,
          isAdmin: decoded.admin === true,
        };
      } catch {
        // Invalid/expired token must never fall through to demo access.
        return null;
      }
    }

    // Admin SDK genuinely not configured: allow an unverified decode in dev so
    // local development keeps working. Never allowed in production.
    if (isAdminConfigured || process.env.NODE_ENV === "production") {
      return null;
    }
    const decoded = decodeUnverifiedJwt(token);
    if (decoded?.uid) {
      return {
        userId: decoded.uid,
        email: decoded.email,
        verified: false,
        isDemo: decoded.uid === DEMO_UID,
        isAdmin: false,
      };
    }
    return null;
  }

  if (!isDemoModeAllowed) {
    return null;
  }

  return {
    userId: DEMO_UID,
    email: "demo@gmail.com",
    verified: false,
    isDemo: true,
    isAdmin: true,
  };
}

/**
 * Returns the effective user id for a data operation, or an error string when
 * the request is not authorized.
 *
 * Verified callers are always scoped to their token UID. Unverified (demo)
 * callers may only act as the demo UID; any other claimed id is rejected.
 */
export function resolveUserScope(
  auth: AuthContext | null,
  claimedUserId?: string | null
): { ok: true; userId: string } | { ok: false; error: string } {
  if (!auth) {
    return { ok: false, error: "Authentication required." };
  }
  if (auth.verified) {
    return { ok: true, userId: auth.userId };
  }
  if (claimedUserId && claimedUserId !== auth.userId) {
    return { ok: false, error: "Unauthorized." };
  }
  return { ok: true, userId: auth.userId };
}
