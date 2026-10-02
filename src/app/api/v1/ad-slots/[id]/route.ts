import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { verifyApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { formatAdSlotResponse } from "@/lib/formatters";
import { invalidateAdPlacementsCache } from "@/lib/ads-db";
import { db, schema } from "@/db";

const VALID_POSITIONS = [
  "header",
  "below_title",
  "in_content",
  "after_content",
  "sidebar",
  "footer",
] as const;

const AdSlotPatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  position: z.enum(VALID_POSITIONS).optional(),
  network: z.enum(["adsense", "custom", "direct"]).optional(),
  ad_client: z.string().max(100).optional().nullable(),
  ad_slot: z.string().max(100).optional().nullable(),
  format: z.string().max(50).optional(),
  responsive: z.boolean().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  show_on: z.enum(["all", "posts_only", "home_only"]).optional(),
  exclude_slugs: z.array(z.string()).optional(),
  custom_code: z.string().optional().nullable(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/v1/ad-slots/:id - Get single ad slot
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
  const decodedId = decodeURIComponent(id).trim();

  try {
    const records = await db
      .select()
      .from(schema.adSlots)
      .where(eq(schema.adSlots.id, decodedId))
      .limit(1);

    if (records.length === 0) {
      return errorResponse("NOT_FOUND", `Ad slot '${decodedId}' not found`, null, 404);
    }

    return successResponse(formatAdSlotResponse(records[0]));
  } catch (error: any) {
    console.error("Error retrieving ad slot:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve ad slot", null, 500);
  }
}

// PATCH /api/v1/ad-slots/:id - Update ad slot
export async function PATCH(request: NextRequest, context: RouteContext) {
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
  const decodedId = decodeURIComponent(id).trim();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid JSON payload in request body", null, 400);
  }

  const parsed = AdSlotPatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.flatten().fieldErrors, 422);
  }

  try {
    const existing = await db
      .select()
      .from(schema.adSlots)
      .where(eq(schema.adSlots.id, decodedId))
      .limit(1);

    if (existing.length === 0) {
      return errorResponse("NOT_FOUND", `Ad slot '${decodedId}' not found`, null, 404);
    }

    const data = parsed.data;
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.position !== undefined) updateData.position = data.position;
    if (data.network !== undefined) updateData.network = data.network;
    if (data.ad_client !== undefined) updateData.adClient = data.ad_client?.trim() || null;
    if (data.ad_slot !== undefined) updateData.adSlot = data.ad_slot?.trim() || null;
    if (data.format !== undefined) updateData.format = data.format;
    if (data.responsive !== undefined) updateData.responsive = data.responsive;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.show_on !== undefined) updateData.showOn = data.show_on;
    if (data.exclude_slugs !== undefined) updateData.excludeSlugs = data.exclude_slugs;
    if (data.custom_code !== undefined) updateData.customCode = data.custom_code?.trim() || null;

    const updated = await db
      .update(schema.adSlots)
      .set(updateData)
      .where(eq(schema.adSlots.id, decodedId))
      .returning();

    await invalidateAdPlacementsCache();

    return successResponse(formatAdSlotResponse(updated[0]));
  } catch (error: any) {
    console.error("Error updating ad slot:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update ad slot", null, 500);
  }
}

// DELETE /api/v1/ad-slots/:id - 204 No Content, 404 if not found
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
  const decodedId = decodeURIComponent(id).trim();

  try {
    const existing = await db
      .select({ id: schema.adSlots.id })
      .from(schema.adSlots)
      .where(eq(schema.adSlots.id, decodedId))
      .limit(1);

    if (existing.length === 0) {
      return errorResponse("NOT_FOUND", `Ad slot '${decodedId}' not found`, null, 404);
    }

    await db.delete(schema.adSlots).where(eq(schema.adSlots.id, decodedId));
    await invalidateAdPlacementsCache();

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("Error deleting ad slot:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to delete ad slot", null, 500);
  }
}
