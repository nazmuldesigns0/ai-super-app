import { NextRequest, NextResponse } from "next/server";
import { passesFillTime, verifyHumanChallenge } from "@/lib/human-check";

export const runtime = "nodejs";

/**
 * Validates a human-check challenge before an auth action is performed.
 * Also rejects instantly-submitted forms and filled honeypots.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (body?.honeypot) {
    return NextResponse.json({ error: "Verification failed." }, { status: 400 });
  }
  if (!passesFillTime(body?.startedAt)) {
    return NextResponse.json(
      { error: "That was too quick — please try again." },
      { status: 400 }
    );
  }
  if (!verifyHumanChallenge(body?.token, body?.answer)) {
    return NextResponse.json(
      { error: "Incorrect security answer. Please try again." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
