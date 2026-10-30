import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { authenticateRequest, resolveUserScope } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    // Verify the caller and scope the request to their own data.
    const auth = await authenticateRequest(req);
    const scope = resolveUserScope(auth, requestedUserId);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.error }, { status: 401 });
    }
    const userId = scope.userId;

    const db = adminDb();
    if (!db) {
      return NextResponse.json({ sessions: [], messages: [] });
    }

    // If specific sessionId requested: return all messages in that session
    if (sessionId) {
      const sessionSnap = await db.collection("chatSessions").doc(sessionId).get();
      if (!sessionSnap.exists || sessionSnap.data()?.userId !== userId) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const messagesSnap = await db
        .collection("messages")
        .where("sessionId", "==", sessionId)
        .orderBy("createdAt", "asc")
        .get();

      const messages = messagesSnap.docs.map((doc) => doc.data());
      return NextResponse.json({ messages });
    }

    // Otherwise list all chat sessions for this user
    const sessionsSnap = await db
      .collection("chatSessions")
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get();

    const sessions = sessionsSnap.docs.map((doc) => doc.data());
    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("GET /api/chat/sessions error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load chat data" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const deleteAll = searchParams.get("all") === "true";
    const requestedUserId = searchParams.get("userId");

    if (!sessionId && !deleteAll) {
      return NextResponse.json(
        { error: "sessionId is required (or pass all=true)" },
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
    if (!db) {
      return NextResponse.json({ success: true });
    }

    // Delete every saved conversation (and its messages) for this user.
    if (deleteAll) {
      const sessionsSnap = await db
        .collection("chatSessions")
        .where("userId", "==", userId)
        .limit(500)
        .get();

      const messageRefs: FirebaseFirestore.DocumentReference[] = [];
      const sessionIds = sessionsSnap.docs.map((doc) => doc.id);

      // Firestore `in` supports up to 30 values; chunk to stay well within it.
      for (let i = 0; i < sessionIds.length; i += 10) {
        const chunk = sessionIds.slice(i, i + 10);
        const msgsSnap = await db
          .collection("messages")
          .where("sessionId", "in", chunk)
          .get();
        msgsSnap.docs.forEach((doc) => messageRefs.push(doc.ref));
      }

      const refsToDelete = [
        ...messageRefs,
        ...sessionsSnap.docs.map((doc) => doc.ref),
      ];

      // Firestore batches are capped at 500 writes; split large deletes.
      for (let i = 0; i < refsToDelete.length; i += 450) {
        const batch = db.batch();
        refsToDelete.slice(i, i + 450).forEach((ref) => batch.delete(ref));
        await batch.commit();
      }

      return NextResponse.json({ success: true, deleted: sessionIds.length });
    }

    // Only the owner may delete a session.
    const sessionRef = db.collection("chatSessions").doc(sessionId as string);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists || sessionSnap.data()?.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete session and its messages
    const batch = db.batch();
    batch.delete(sessionRef);

    const msgsSnap = await db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .get();

    msgsSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    return NextResponse.json({ success: true, sessionId });
  } catch (error: any) {
    console.error("DELETE /api/chat/sessions error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete session" },
      { status: 500 }
    );
  }
}
