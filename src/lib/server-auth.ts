import type { NextRequest } from "next/server";
import { adminAuth, isAdminConfigured } from "@/lib/firebase/admin";
import { isAdminEmail } from "@/lib/admin-config";

export interface AuthContext {
  /** The user id the request is allowed to act as. Always server-derived. */
  userId: string;
  email?: string;
  /** True when a Firebase ID token was present and verified server-side. */
  verified: boolean;
  /** The email address on the token has been verified by Firebase. */
  emailVerified: boolean;
  isAdmin: boolean;
}

/**
 * Last-resort decoder used ONLY in non-production environments when the Admin
 * SDK is not configured (no service account) so local development with a real
 * Firebase client still works. The token is NOT verified here.
 */
function decodeUnverifiedJwt(
  token: string
): { uid?: string; email?: string; emailVerified?: boolean } | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const json = Buffer.from(
      payloadPart.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    const payload = JSON.parse(json);
    return {
      uid: payload.user_id || payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === true,
    };
  } catch {
    return null;
  }
}

/**
 * Resolves the caller's identity from a Firebase ID token.
 *
 *  1. `Authorization: Bearer <idToken>` -> verified with the Admin SDK.
 *  2. Token present but Admin SDK not configured -> unverified decode, dev only.
 *  3. No token -> `null` (every protected API requires authentication).
 *
 * Admins are recognised both from the `admin` custom claim and from the
 * server-side ADMIN_EMAILS allow-list, so the owner accounts keep admin access
 * even before their token has been refreshed with the claim.
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<AuthContext | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";

  if (!token) return null;

  const auth = adminAuth();
  if (auth) {
    try {
      const decoded = await auth.verifyIdToken(token);
      return {
        userId: decoded.uid,
        email: decoded.email,
        verified: true,
        emailVerified: decoded.email_verified === true,
        isAdmin: decoded.admin === true || isAdminEmail(decoded.email),
      };
    } catch {
      // Invalid/expired tokens are always rejected.
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
      emailVerified: decoded.emailVerified === true,
      isAdmin: isAdminEmail(decoded.email),
    };
  }
  return null;
}

/**
 * Returns the effective user id for a data operation, or an error string when
 * the request is not authorized. Verified callers are always scoped to their
 * token UID; a client can never act as another account.
 */
export function resolveUserScope(
  auth: AuthContext | null,
  claimedUserId?: string | null
): { ok: true; userId: string } | { ok: false; error: string } {
  if (!auth) {
    return { ok: false, error: "Authentication required." };
  }
  if (claimedUserId && claimedUserId !== auth.userId) {
    return { ok: false, error: "Unauthorized." };
  }
  return { ok: true, userId: auth.userId };
}
