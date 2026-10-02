import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { verifyApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { formatMediaResponse } from "@/lib/formatters";
import { deleteStoredFile } from "@/lib/storage";
import { db, schema } from "@/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/v1/media/:id
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await verifyApiKey(request);
  if (!auth.authenticated) {
    return errorResponse(
      auth.errorCode || "UNAUTHORIZED",
      auth.error || "Unauthorized",
      auth.details || null,
      auth.statusCode || 401
    );
  }

  const { id } = await context.params;

  try {
    const existing = await db
      .select()
      .from(schema.media)
      .where(eq(schema.media.id, id))
      .limit(1);

    if (existing.length === 0) {
      return errorResponse("NOT_FOUND", `Media with id '${id}' not found`, null, 404);
    }

    return successResponse(formatMediaResponse(existing[0]));
  } catch (error) {
    console.error("Error retrieving media:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve media", null, 500);
  }
}

// DELETE /api/v1/media/:id
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await verifyApiKey(request);
  if (!auth.authenticated) {
    return errorResponse(
      auth.errorCode || "UNAUTHORIZED",
      auth.error || "Unauthorized",
      auth.details || null,
      auth.statusCode || 401
    );
  }

  const { id } = await context.params;

  try {
    const existing = await db
      .select()
      .from(schema.media)
      .where(eq(schema.media.id, id))
      .limit(1);

    if (existing.length === 0) {
      return errorResponse("NOT_FOUND", `Media with id '${id}' not found`, null, 404);
    }

    const mediaItem = existing[0];

    // Remove file from storage (Cloudinary or local /public/uploads)
    await deleteStoredFile(mediaItem);

    // Hard delete record from media table
    await db.delete(schema.media).where(eq(schema.media.id, id));

    // Return 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting media:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to delete media", null, 500);
  }
}
