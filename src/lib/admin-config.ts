/**
 * Server-only list of the accounts that own the platform.
 *
 * These addresses are always provisioned as admins, are placed on the most
 * expensive package and have no credit limit.
 */
const FALLBACK_ADMIN_EMAILS = [
  "nazmuldesigns0@gmail.com",
  "shmimmd437@gmail.com",
  "md.nazmulhasan693@gmail.com",
];

export const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || FALLBACK_ADMIN_EMAILS.join(","))
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
