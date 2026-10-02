import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";
import { db, schema } from "@/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/api-keys/:id - Toggle active/inactive
export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getCurrentAdmin();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Admin session required", null, 401);
  }

  const { id } = await context.params;

  try {
    const body = await request.json().catch(() => ({}));
    const isActive = body.is_active !== undefined ? Boolean(body.is_active) : undefined;

    const existing = await db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.id, id))
      .limit(1);

    if (existing.length === 0) {
      return errorResponse("NOT_FOUND", "API key not found", null, 404);
    }

    const newActiveState = isActive !== undefined ? isActive : !existing[0].isActive;

    await db
      .update(schema.apiKeys)
      .set({ isActive: newActiveState })
      .where(eq(schema.apiKeys.id, id));

    return successResponse({
      message: `API key ${newActiveState ? "activated" : "deactivated"} successfully`,
      id,
      isActive: newActiveState,
    });
  } catch (error) {
    console.error("Error updating API key:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update API key", null, 500);
  }
}

// DELETE /api/admin/api-keys/:id - Delete / Revoke key
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await getCurrentAdmin();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Admin session required", null, 401);
  }

  const { id } = await context.params;

  try {
    const existing = await db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.id, id))
      .limit(1);

    if (existing.length === 0) {
      return errorResponse("NOT_FOUND", "API key not found", null, 404);
    }

    await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, id));

    return successResponse({
      message: "API key deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to delete API key", null, 500);
  }
}
