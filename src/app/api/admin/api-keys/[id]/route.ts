import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";
import { db, schema } from "@/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await getCurrentAdmin();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Admin session required", null, 401);
  }

  const { id } = await context.params;

  try {
    const existing = await db
      .select({ id: schema.apiKeys.id })
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.id, id))
      .limit(1);

    if (existing.length === 0) {
      return errorResponse("NOT_FOUND", "API Key not found", null, 404);
    }

    await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, id));

    return successResponse({ message: "API key revoked and deleted successfully" });
  } catch (error) {
    console.error("Error revoking API key:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to revoke API key", null, 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getCurrentAdmin();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Admin session required", null, 401);
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  try {
    const updateValues: Record<string, unknown> = {};
    if (typeof body.isActive === "boolean") updateValues.isActive = body.isActive;
    if (body.name) updateValues.name = body.name;

    await db.update(schema.apiKeys).set(updateValues).where(eq(schema.apiKeys.id, id));

    return successResponse({ message: "API key updated successfully" });
  } catch (error) {
    console.error("Error updating API key:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update API key", null, 500);
  }
}
