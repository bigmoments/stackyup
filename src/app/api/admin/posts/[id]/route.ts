import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentAdmin();
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);
    }

    const { id } = await params;
    if (!id) {
      return errorResponse("VALIDATION_ERROR", "Post ID is required", null, 400);
    }

    await db.delete(schema.posts).where(eq(schema.posts.id, id));
    return successResponse({ message: "Post deleted successfully" });
  } catch (err: any) {
    console.error("Delete post error:", err);
    return errorResponse("INTERNAL_SERVER_ERROR", err.message || "Failed to delete post", null, 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentAdmin();
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!id || !status) {
      return errorResponse("VALIDATION_ERROR", "ID and status are required", null, 400);
    }

    await db
      .update(schema.posts)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.posts.id, id));

    return successResponse({ message: `Post status updated to ${status}` });
  } catch (err: any) {
    console.error("Update post status error:", err);
    return errorResponse("INTERNAL_SERVER_ERROR", err.message || "Failed to update status", null, 500);
  }
}
