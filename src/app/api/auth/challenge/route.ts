import { NextResponse } from "next/server";
import { createHumanChallenge } from "@/lib/human-check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Issues a signed "are you a robot?" challenge for the auth + support forms. */
export async function GET() {
  return NextResponse.json(createHumanChallenge(), {
    headers: { "Cache-Control": "no-store" },
  });
}
