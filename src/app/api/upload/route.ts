import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { authenticateRequest, requireVerifiedEmail, resolveUserScope } from "@/lib/server-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { v4 as uuidv4 } from "uuid";

// 10 MB strict limit
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Uploads allowed per user per minute. */
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Server-side MIME allowlist (mirrors storage.rules).
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
];

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestedUserId = formData.get("userId") as string | null;
    const source = (formData.get("source") as string) || "chat";

    const scope = resolveUserScope(auth, requestedUserId);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.error }, { status: 401 });
    }
    const userId = scope.userId;

    const rateLimited = enforceRateLimit(req, {
      limit: RATE_LIMIT_MAX,
      windowMs: RATE_LIMIT_WINDOW_MS,
      userId,
    });
    if (rateLimited) return rateLimited;

    const unverified = requireVerifiedEmail(auth);
    if (unverified) return unverified;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds the 10MB limit. Current size is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
        },
        { status: 400 }
      );
    }

    // MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type "${file.type || "unknown"}". Allowed: images, PDF, Word, text, CSV, JSON.`,
        },
        { status: 400 }
      );
    }

    const fileId = uuidv4();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "application/octet-stream";
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    let publicUrl = dataUrl;
    let storagePath = `uploads/${userId}/${fileId}_${file.name}`;

    // Attempt Firebase Storage upload if available
    const storage = adminStorage();
    if (storage) {
      try {
        const bucket = storage.bucket();
        const gcsFile = bucket.file(storagePath);
        await gcsFile.save(buffer, {
          contentType: mimeType,
          metadata: {
            cacheControl: "public, max-age=31536000",
          },
        });
        // Try getting signed URL or public URL
        const [signedUrl] = await gcsFile.getSignedUrl({
          action: "read",
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        publicUrl = signedUrl;
      } catch (storageErr) {
        console.warn("Storage upload failed, falling back to data URL:", storageErr);
      }
    }

    // Save to Firestore Library with 30-day auto-expiry
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const db = adminDb();
    if (db && userId && userId !== "anonymous") {
      try {
        await db.collection("libraryFiles").doc(fileId).set({
          id: fileId,
          userId,
          name: file.name,
          fileType: mimeType,
          storagePath,
          publicUrl,
          sizeBytes: file.size,
          source,
          expiresAt, // Auto deletion deadline
          createdAt: now,
        });
      } catch (dbErr) {
        console.warn("Could not write file metadata to Firestore libraryFiles:", dbErr);
      }
    }

    return NextResponse.json({
      id: fileId,
      name: file.name,
      type: mimeType,
      size: file.size,
      url: publicUrl,
      data: dataUrl,
      expiresAt,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process file upload" },
      { status: 500 }
    );
  }
}
