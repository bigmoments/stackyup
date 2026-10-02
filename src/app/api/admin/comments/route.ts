import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = db.select().from(schema.comments).orderBy(desc(schema.comments.createdAt));

    const comments = status && status !== "all"
      ? await db.select().from(schema.comments).where(eq(schema.comments.status, status)).orderBy(desc(schema.comments.createdAt))
      : await query;

    return successResponse({ comments });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentAdmin(request);
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json();
    const { postId, postTitle, authorName, authorEmail, content } = body;

    if (!postId || !authorName || !content) {
      return errorResponse("VALIDATION_ERROR", "Missing required fields", null, 400);
    }

    const id = `com_${nanoid(12)}`;
    await db.insert(schema.comments).values({
      id,
      postId,
      postTitle: postTitle || "StackYup Article",
      authorName: authorName.trim(),
      authorEmail: authorEmail?.trim() || null,
      content: content.trim(),
      status: "approved",
    });

    return successResponse({ message: "Comment added", id });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}
