import crypto from "crypto";

/**
 * Zero-dependency human check ("are you a robot?").
 *
 * A small arithmetic question is generated server-side and signed with an
 * HMAC. The client must answer it correctly within 10 minutes. Together with
 * a honeypot field and a minimum fill time this reliably stops scripted bots
 * without needing a third-party captcha account (so it stays free forever).
 *
 * If you later add Cloudflare Turnstile or reCAPTCHA keys, this can be
 * swapped out behind the same two functions.
 */

const SECRET =
  process.env.HUMAN_CHECK_SECRET ||
  process.env.AUTH_SECRET ||
  "nexora-human-check-secret-v1";

const CHALLENGE_TTL_MS = 10 * 60 * 1000;

export interface HumanChallenge {
  token: string;
  question: string;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 32);
}

export function createHumanChallenge(): HumanChallenge {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 1 + Math.floor(Math.random() * 9);
  const ops = ["+", "-", "x"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  // Keep subtraction non-negative so the answer is always a simple whole number.
  const [x, y] = op === "-" && b > a ? [b, a] : [a, b];
  const exp = Date.now() + CHALLENGE_TTL_MS;
  const payload = `${x}.${y}.${op}.${exp}`;
  return {
    token: `${payload}.${sign(payload)}`,
    question: `What is ${x} ${op === "x" ? "×" : op} ${y}?`,
  };
}

export function verifyHumanChallenge(
  token: string | null | undefined,
  answer: string | number | null | undefined
): boolean {
  if (!token || answer === null || answer === undefined) return false;
  const parts = String(token).split(".");
  if (parts.length !== 5) return false;

  const [x, y, op, exp, sig] = parts;
  const payload = `${x}.${y}.${op}.${exp}`;
  if (sign(payload) !== sig) return false;
  if (Number(exp) < Date.now()) return false;

  const expected =
    op === "+" ? Number(x) + Number(y) : op === "-" ? Number(x) - Number(y) : Number(x) * Number(y);

  return String(answer).trim() === String(expected);
}

/** Number of milliseconds a form must have been open — bots submit instantly. */
export const MIN_FILL_TIME_MS = 1500;

export function passesFillTime(startedAt: string | number | null | undefined): boolean {
  const started = Number(startedAt);
  if (!started || Number.isNaN(started)) return false;
  return Date.now() - started >= MIN_FILL_TIME_MS;
}
