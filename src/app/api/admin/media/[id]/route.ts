import { NextRequest } from "next/server";
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
      return errorResponse("VALIDATION_ERROR", "Media ID is required", null, 400);
    }

    const existing = await db
      .select()
      .from(schema.media)
      .where(eq(schema.media.id, id))
      .limit(1);

    if (existing.length === 0) {
      return errorResponse("NOT_FOUND", "Media asset not found", null, 404);
    }

    await db.delete(schema.media).where(eq(schema.media.id, id));

    return successResponse({ message: "Media deleted successfully", id });
  } catch (err: any) {
    console.error("Delete media error:", err);
    return errorResponse("INTERNAL_SERVER_ERROR", err.message || "Failed to delete media", null, 500);
  }
}
