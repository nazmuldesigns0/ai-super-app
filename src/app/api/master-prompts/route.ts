import { NextRequest, NextResponse } from "next/server";
import { MASTER_PROMPTS_DATA } from "@/data/masterPrompts";
import { adminDb } from "@/lib/firebase/admin";
import { authenticateRequest } from "@/lib/server-auth";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const db = adminDb();
    let customPrompts: any[] = [];

    if (db) {
      try {
        const snap = await db.collection("masterPrompts").orderBy("createdAt", "desc").get();
        customPrompts = snap.docs.map((doc) => doc.data());
      } catch (err) {
        console.warn("Could not fetch custom master prompts from Firestore:", err);
      }
    }

    // Merge default catalog with custom prompts
    return NextResponse.json({
      prompts: [...MASTER_PROMPTS_DATA, ...customPrompts],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load master prompts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Only admins may publish master prompts (matches firestore.rules).
    const auth = await authenticateRequest(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, category, promptTemplate, formSchema } = body;

    if (!title || !promptTemplate) {
      return NextResponse.json(
        { error: "Title and promptTemplate are required" },
        { status: 400 }
      );
    }

    if (
      typeof title !== "string" ||
      typeof promptTemplate !== "string" ||
      title.length > 200 ||
      promptTemplate.length > 20_000
    ) {
      return NextResponse.json(
        { error: "Title or promptTemplate exceeds the allowed length." },
        { status: 400 }
      );
    }

    const db = adminDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const newPrompt = {
      id,
      title,
      description: description || "",
      category: category || "Custom Prompts",
      badge: "Custom",
      formFields: formSchema || [],
      promptTemplate,
      isPublic: true,
      createdBy: auth.userId,
      usageCount: 0,
      createdAt: now,
    };

    if (db) {
      await db.collection("masterPrompts").doc(id).set(newPrompt);
    }

    return NextResponse.json({ success: true, prompt: newPrompt });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create master prompt" },
      { status: 500 }
    );
  }
}
