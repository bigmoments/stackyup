import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { verifyApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { formatAffiliateResponse } from "@/lib/formatters";
import { db, schema } from "@/db";

const AffiliatePatchSchema = z.object({
  brand: z.string().min(1).max(100).optional(),
  url: z.string().url("Valid destination URL is required").optional(),
  category: z.string().max(100).optional().nullable(),
  default_anchor_text: z.string().max(150).optional().nullable(),
  status: z.enum(["active", "inactive", "paused"]).optional(),
  disclosure_text: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/v1/affiliates/:id - Full object including destination URL
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
      .from(schema.affiliates)
      .where(eq(schema.affiliates.id, decodedId))
      .limit(1);

    if (records.length === 0) {
      // Also check normalized ID with/without aff_ prefix
      const altId = decodedId.startsWith("aff_") ? decodedId.replace(/^aff_/, "") : `aff_${decodedId}`;
      const altRecords = await db
        .select()
        .from(schema.affiliates)
        .where(eq(schema.affiliates.id, altId))
        .limit(1);

      if (altRecords.length === 0) {
        return errorResponse("NOT_FOUND", `Affiliate partner '${decodedId}' not found`, null, 404);
      }

      return successResponse(formatAffiliateResponse(altRecords[0]));
    }

    return successResponse(formatAffiliateResponse(records[0]));
  } catch (error: any) {
    console.error("Error retrieving affiliate:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve affiliate partner", null, 500);
  }
}

// PATCH /api/v1/affiliates/:id - Partial update affiliate partner
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

  const parsed = AffiliatePatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.flatten().fieldErrors, 422);
  }

  try {
    // Find record
    const existing = await db
      .select()
      .from(schema.affiliates)
      .where(eq(schema.affiliates.id, decodedId))
      .limit(1);

    let targetId = decodedId;
    if (existing.length === 0) {
      const altId = decodedId.startsWith("aff_") ? decodedId.replace(/^aff_/, "") : `aff_${decodedId}`;
      const altRecords = await db
        .select()
        .from(schema.affiliates)
        .where(eq(schema.affiliates.id, altId))
        .limit(1);

      if (altRecords.length === 0) {
        return errorResponse("NOT_FOUND", `Affiliate partner '${decodedId}' not found`, null, 404);
      }
      targetId = altId;
    }

    const data = parsed.data;
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.brand !== undefined) updateData.brand = data.brand.trim();
    if (data.url !== undefined) updateData.url = data.url.trim();
    if (data.category !== undefined) updateData.category = data.category?.trim() || null;
    if (data.default_anchor_text !== undefined) updateData.defaultAnchorText = data.default_anchor_text?.trim() || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.disclosure_text !== undefined) updateData.disclosureText = data.disclosure_text?.trim() || null;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;

    const updated = await db
      .update(schema.affiliates)
      .set(updateData)
      .where(eq(schema.affiliates.id, targetId))
      .returning();

    return successResponse(formatAffiliateResponse(updated[0]));
  } catch (error: any) {
    console.error("Error updating affiliate:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update affiliate partner", null, 500);
  }
}

// DELETE /api/v1/affiliates/:id - 204 No Content, 404 if not found (Graceful deletion: shortcode in articles will degrade to plain text)
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
      .select({ id: schema.affiliates.id })
      .from(schema.affiliates)
      .where(eq(schema.affiliates.id, decodedId))
      .limit(1);

    let targetId = decodedId;
    if (existing.length === 0) {
      const altId = decodedId.startsWith("aff_") ? decodedId.replace(/^aff_/, "") : `aff_${decodedId}`;
      const altRecords = await db
        .select({ id: schema.affiliates.id })
        .from(schema.affiliates)
        .where(eq(schema.affiliates.id, altId))
        .limit(1);

      if (altRecords.length === 0) {
        return errorResponse("NOT_FOUND", `Affiliate partner '${decodedId}' not found`, null, 404);
      }
      targetId = altId;
    }

    // Hard delete from database
    await db.delete(schema.affiliates).where(eq(schema.affiliates.id, targetId));

    // Return 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("Error deleting affiliate:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to delete affiliate partner", null, 500);
  }
}
