/**
 * Gmail-only validation helpers
 * Enforced at client, server actions, and Cloud Functions levels
 */

export function isGmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim().endsWith("@gmail.com");
}

export function validateGmailOnly(email: string): {
  valid: boolean;
  error?: string;
} {
  if (!email || !email.trim()) {
    return { valid: false, error: "Email is required" };
  }

  const normalized = email.toLowerCase().trim();

  if (!normalized.includes("@")) {
    return { valid: false, error: "Invalid email format" };
  }

  if (!normalized.endsWith("@gmail.com")) {
    return {
      valid: false,
      error: "Only @gmail.com emails are allowed to sign up / log in.",
    };
  }

  return { valid: true };
}
