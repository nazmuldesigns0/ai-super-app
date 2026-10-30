/**
 * Browser notification helpers.
 *
 * Used to alert the user when a long-running task (chat response, image
 * generation/editing) finishes while the tab is in the background. Every
 * helper degrades to a silent no-op when the Notification API is unavailable
 * or permission has been denied, so it is always safe to call.
 */

const ICON_PATH = "/icon.svg";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Ask for notification permission. Must be called from a user gesture (e.g. the
 * click that starts a task). Resolves immediately once the user has decided.
 */
export async function prepareNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

/**
 * Show a completion notification, but only when the tab is hidden (the user
 * switched tabs or minimised the window).
 */
export function notifyOnComplete(title: string, body: string): void {
  if (!notificationsSupported()) return;
  if (Notification.permission !== "granted") return;
  if (typeof document !== "undefined" && !document.hidden) return;

  try {
    const notification = new Notification(title, {
      body,
      icon: ICON_PATH,
      tag: "nexora-task",
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Some browsers (e.g. mobile Safari) throw for the constructor form.
  }
}
