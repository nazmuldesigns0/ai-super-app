/** Shared announcement types (client-safe — no server-only imports). */

export type AnnouncementTone = "info" | "success" | "warning";

export interface Announcement {
  enabled: boolean;
  title: string;
  message: string;
  tone: AnnouncementTone;
  /** Changes whenever the content is edited, so users see the new notice once. */
  version: number;
  updatedAt?: string;
}

/** Firestore document id inside the `appSettings` collection. */
export const ANNOUNCEMENT_DOC_ID = "announcement";

export const ANNOUNCEMENT_TONES: AnnouncementTone[] = ["info", "success", "warning"];

export const EMPTY_ANNOUNCEMENT: Announcement = {
  enabled: false,
  title: "",
  message: "",
  tone: "info",
  version: 1,
};
