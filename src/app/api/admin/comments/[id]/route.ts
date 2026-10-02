import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentAdmin(request);
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!id || !status) return errorResponse("VALIDATION_ERROR", "ID and status are required", null, 400);

    await db
      .update(schema.comments)
      .set({ status })
      .where(eq(schema.comments.id, id));

    return successResponse({ message: `Comment status updated to ${status}` });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentAdmin(request);
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const { id } = await params;
    if (!id) return errorResponse("VALIDATION_ERROR", "Comment ID is required", null, 400);

    await db.delete(schema.comments).where(eq(schema.comments.id, id));
    return successResponse({ message: "Comment deleted successfully" });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}
