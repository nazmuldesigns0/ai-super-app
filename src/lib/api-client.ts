import { auth, isFirebaseConfigured } from "@/lib/firebase/client";

/**
 * `fetch` wrapper that attaches the current Firebase ID token as a Bearer
 * header so API routes can verify the caller. Falls back to a plain request in
 * demo/local mode where no real session exists.
 */
export async function authFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers || {});

  if (isFirebaseConfigured && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers.set("Authorization", `Bearer ${token}`);
    } catch {
      // Token refresh failed — proceed; the server decides whether to allow it.
    }
  }

  return fetch(input, { ...init, headers });
}
