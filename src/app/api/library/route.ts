import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { authenticateRequest, resolveUserScope } from "@/lib/server-auth";

/**
 * GET /api/library?userId=...
 * Lists library files for a user with calculated days left until 30-day purge.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    const auth = await authenticateRequest(req);
    const scope = resolveUserScope(auth, requestedUserId);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.error }, { status: 401 });
    }
    const userId = scope.userId;

    const db = adminDb();
    if (!db) {
      return NextResponse.json({
        files: [],
        warning: "Database not configured. Showing local mode.",
      });
    }

    const snap = await db
      .collection("libraryFiles")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const now = new Date();
    const files = snap.docs.map((doc) => {
      const data = doc.data();
      const expiresAt = new Date(data.expiresAt || Date.now() + 30 * 86400 * 1000);
      const diffMs = expiresAt.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      return {
        ...data,
        id: doc.id,
        daysLeft,
        isExpired: daysLeft <= 0,
      };
    });

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error("GET /api/library error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve library files" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/library/cleanup
 * Scans for files where expiresAt <= now, deletes storage objects, and removes Firestore records.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const db = adminDb();
    const storage = adminStorage();

    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available for automated cleanup." },
        { status: 503 }
      );
    }

    const nowIso = new Date().toISOString();
    // Query files where expiresAt <= nowIso
    const expiredSnap = await db
      .collection("libraryFiles")
      .where("expiresAt", "<=", nowIso)
      .limit(500)
      .get();

    let deletedCount = 0;
    const batch = db.batch();

    for (const doc of expiredSnap.docs) {
      const data = doc.data();

      // If storage path exists, attempt deletion from bucket
      if (storage && data.storagePath) {
        try {
          const bucket = storage.bucket();
          await bucket.file(data.storagePath).delete({ ignoreNotFound: true });
        } catch (err) {
          console.warn(`Could not delete storage file: ${data.storagePath}`, err);
        }
      }

      batch.delete(doc.ref);
      deletedCount++;
    }

    if (deletedCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `30-Day automated cleanup completed. Removed ${deletedCount} expired file(s).`,
      deletedCount,
      timestamp: nowIso,
    });
  } catch (error: any) {
    console.error("POST /api/library cleanup error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to run automated cleanup routine" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/library?id=...&userId=...
 * Manually deletes a single file before 30-day auto-purge.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("id");
    const requestedUserId = searchParams.get("userId");

    if (!fileId) {
      return NextResponse.json(
        { error: "id parameter is required" },
        { status: 400 }
      );
    }

    const auth = await authenticateRequest(req);
    const scope = resolveUserScope(auth, requestedUserId);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.error }, { status: 401 });
    }
    const userId = scope.userId;

    const db = adminDb();
    const storage = adminStorage();

    if (!db) {
      return NextResponse.json(
        { error: "Database not configured." },
        { status: 503 }
      );
    }

    const docRef = db.collection("libraryFiles").doc(fileId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const data = docSnap.data();
    if (data?.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this file" },
        { status: 403 }
      );
    }

    if (storage && data?.storagePath) {
      try {
        await storage.bucket().file(data.storagePath).delete({ ignoreNotFound: true });
      } catch (err) {
        console.warn(`Could not delete storage file ${data.storagePath}`, err);
      }
    }

    await docRef.delete();

    return NextResponse.json({ success: true, fileId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete file" },
      { status: 500 }
    );
  }
}
