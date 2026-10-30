import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/server-auth";
import { provisionUser } from "@/lib/user-provision";
import { isMailerConfigured, sendMail, welcomeEmail } from "@/lib/mailer";

export const runtime = "nodejs";

/**
 * Called by the client right after a successful sign-in / sign-up. Creates the
 * Firestore profile, applies the correct package + credit balance and, for the
 * owner e-mail addresses, grants the `admin` custom claim.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth || !auth.email) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const provider: string | undefined = body?.provider;

  const result = await provisionUser({
    uid: auth.userId,
    email: auth.email,
    fullName: body?.fullName,
    photoURL: body?.photoURL,
    provider,
  });

  // Google sign-ups skip the e-mail code — send a welcome message instead.
  if (
    result.isNewUser &&
    result.profile &&
    provider === "google.com" &&
    isMailerConfigured()
  ) {
    try {
      await sendMail({ to: auth.email, ...welcomeEmail(result.profile.fullName) });
    } catch (err) {
      console.warn("[Provision] Welcome email failed:", err);
    }
  }

  return NextResponse.json({
    profile: result.profile,
    isAdmin: result.isAdmin,
    isNewUser: result.isNewUser,
    claimUpdated: result.claimUpdated,
  });
}
