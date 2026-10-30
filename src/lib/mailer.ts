import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { SITE } from "@/lib/site";

/**
 * Free email delivery for verification codes, welcome messages and support
 * tickets. Two transports are supported, both on permanent free tiers:
 *
 *   1. Gmail SMTP (recommended) — set GMAIL_USER + GMAIL_APP_PASSWORD.
 *      Sends to any recipient with no domain required.
 *   2. Resend (fallback)       — set RESEND_API_KEY (+ MAIL_FROM if you own
 *      a verified domain).
 *
 * When neither is configured `isMailerConfigured()` returns false and the
 * verification flow automatically falls back to Firebase's own free
 * verification email, so the app keeps working with zero setup.
 */

const GMAIL_USER = (process.env.GMAIL_USER || process.env.SMTP_USER || "").trim();
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "").trim();
const RESEND_API_KEY = (process.env.RESEND_API_KEY || "").trim();
const MAIL_FROM =
  process.env.MAIL_FROM ||
  (GMAIL_USER ? `${SITE.name} <${GMAIL_USER}>` : `${SITE.name} <onboarding@resend.dev>`);

export type MailTransport = "gmail" | "resend" | "none";

export function resolveMailTransport(): MailTransport {
  if (GMAIL_USER && GMAIL_APP_PASSWORD) return "gmail";
  if (RESEND_API_KEY) return "resend";
  return "none";
}

export function isMailerConfigured(): boolean {
  return resolveMailTransport() !== "none";
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let cachedTransporter: Transporter | null = null;

function gmailTransporter(): Transporter {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return cachedTransporter;
}

/** Sends an email through whichever transport is configured. Never throws. */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const transport = resolveMailTransport();
  try {
    if (transport === "gmail") {
      await gmailTransporter().sendMail({ from: MAIL_FROM, ...message });
      return true;
    }
    if (transport === "resend") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: MAIL_FROM,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });
      return res.ok;
    }
  } catch (err) {
    console.error("[Mailer] Failed to send email:", err);
  }
  return false;
}

// ── Templates ────────────────────────────────────────────────────────────────

function shell(inner: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f5f3ff;font-family:Inter,Segoe UI,Arial,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(124,58,237,.15)">
    <div style="background:linear-gradient(120deg,#7c3aed,#d946ef,#06b6d4);padding:28px 32px;color:#ffffff">
      <div style="font-size:22px;font-weight:800;letter-spacing:.3px">${SITE.name}</div>
      <div style="font-size:12px;opacity:.9;margin-top:4px">${SITE.tagline}</div>
    </div>
    <div style="padding:32px;color:#1f2937;line-height:1.6;font-size:15px">${inner}</div>
    <div style="padding:18px 32px;background:#faf5ff;color:#6b7280;font-size:12px">
      Need help? Reply to this email or contact <a href="mailto:${SITE.supportEmail}" style="color:#7c3aed">${SITE.supportEmail}</a>.
    </div>
  </div>
</body></html>`;
}

export function verificationCodeEmail(code: string): Omit<MailMessage, "to"> {
  const text = `${SITE.name} verification code: ${code}\n\nThis code expires in 10 minutes. If you did not request it, you can ignore this email.`;
  const html = shell(`
    <p style="margin:0 0 12px">Hello,</p>
    <p style="margin:0 0 20px">Use the code below to verify your email address and finish setting up your ${SITE.name} account.</p>
    <div style="text-align:center;margin:24px 0">
      <div style="display:inline-block;padding:16px 28px;border-radius:14px;background:#f3e8ff;border:1px solid #e9d5ff;font-size:34px;font-weight:800;letter-spacing:10px;color:#6d28d9">${code}</div>
    </div>
    <p style="margin:0;color:#6b7280;font-size:13px">The code expires in <strong>10 minutes</strong>. If you did not create an account, no action is needed.</p>
  `);
  return { subject: `${code} is your ${SITE.name} verification code`, html, text };
}

export function welcomeEmail(name: string): Omit<MailMessage, "to"> {
  const safeName = name || "there";
  const text = `Welcome to ${SITE.name}, ${safeName}! Your account is ready. Start chatting, generating images and creating with ${SITE.name}.`;
  const html = shell(`
    <p style="margin:0 0 12px">Hi ${safeName},</p>
    <p style="margin:0 0 16px">Welcome to <strong>${SITE.name}</strong> — thanks for signing up with Google. Your account is ready to go.</p>
    <p style="margin:0 0 8px">You can now:</p>
    <ul style="margin:0 0 20px;padding-left:20px">
      <li>Chat with every AI model (plus the two-model Arena)</li>
      <li>Generate and edit images in the Image Studio</li>
      <li>Use Master Prompts, background removal and enhancement</li>
    </ul>
    <p style="margin:0">Happy creating!<br/>— The ${SITE.name} team</p>
  `);
  return { subject: `Welcome to ${SITE.name}, ${safeName}!`, html, text };
}

export function supportAckEmail(name: string): Omit<MailMessage, "to"> {
  const safeName = name || "there";
  const text = `Thanks for contacting ${SITE.name} support, ${safeName}. We received your message and will reply as soon as possible.`;
  const html = shell(`
    <p style="margin:0 0 12px">Hi ${safeName},</p>
    <p style="margin:0">Thanks for reaching out. We received your message and our team will get back to you as soon as possible. If you need to add details, just reply to this email.</p>
  `);
  return { subject: `We received your message — ${SITE.name} Support`, html, text };
}

export function supportNotifyEmail(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Omit<MailMessage, "to"> {
  const safe = (value: string) =>
    value.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] as string);
  const text = `New support message from ${input.name} <${input.email}>\nSubject: ${input.subject}\n\n${input.message}`;
  const html = shell(`
    <p style="margin:0 0 6px"><strong>New support message</strong></p>
    <p style="margin:0 0 4px"><strong>From:</strong> ${safe(input.name)} &lt;${safe(input.email)}&gt;</p>
    <p style="margin:0 0 16px"><strong>Subject:</strong> ${safe(input.subject)}</p>
    <div style="white-space:pre-wrap;padding:14px;border-radius:12px;background:#f9fafb;border:1px solid #eee">${safe(input.message)}</div>
    <p style="margin:16px 0 0;color:#6b7280;font-size:13px">Reply directly to this email to answer the user.</p>
  `);
  return { subject: `[Support] ${input.subject}`, html, text };
}

