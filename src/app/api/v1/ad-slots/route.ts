import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { formatAdSlotResponse } from "@/lib/formatters";
import { invalidateAdPlacementsCache } from "@/lib/ads-db";
import { db, schema } from "@/db";

export const VALID_POSITIONS = [
  "header",
  "below_title",
  "in_content",
  "after_content",
  "sidebar",
  "footer",
] as const;

const AdSlotCreateSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  name: z.string().min(1, "Name is required").max(100),
  position: z.enum(VALID_POSITIONS, {
    message: "Position must be one of: header, below_title, in_content, after_content, sidebar, footer",
  }),
  network: z.enum(["adsense", "custom", "direct"]).default("adsense").optional(),
  ad_client: z.string().max(100).optional().nullable(),
  ad_slot: z.string().max(100).optional().nullable(),
  format: z.string().max(50).default("auto").optional(),
  responsive: z.boolean().default(true).optional(),
  status: z.enum(["active", "inactive"]).default("active").optional(),
  show_on: z.enum(["all", "posts_only", "home_only"]).default("all").optional(),
  exclude_slugs: z.array(z.string()).default([]).optional(),
  custom_code: z.string().optional().nullable(),
});

// GET /api/v1/ad-slots - List all ad slots
export async function GET(request: NextRequest) {
  const auth = await verifyApiKey(request);
  if (!auth.authenticated) {
    return errorResponse(
      auth.errorCode || "UNAUTHORIZED",
      auth.error || "Unauthorized",
      auth.details || null,
      auth.statusCode || 401
    );
  }

  try {
    const list = await db
      .select()
      .from(schema.adSlots)
      .orderBy(desc(schema.adSlots.createdAt));

    return successResponse({
      ad_slots: list.map(formatAdSlotResponse),
      count: list.length,
    });
  } catch (error: any) {
    console.error("Error listing ad slots:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve ad slots", null, 500);
  }
}

// POST /api/v1/ad-slots - Create a new ad slot
export async function POST(request: NextRequest) {
  const auth = await verifyApiKey(request);
  if (!auth.authenticated) {
    return errorResponse(
      auth.errorCode || "UNAUTHORIZED",
      auth.error || "Unauthorized",
      auth.details || null,
      auth.statusCode || 401
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid JSON payload in request body", null, 400);
  }

  const parsed = AdSlotCreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.flatten().fieldErrors, 422);
  }

  const data = parsed.data;
  const slotId = data.id?.trim() || `slot_${data.position}_${nanoid(6)}`;

  try {
    const existing = await db
      .select({ id: schema.adSlots.id })
      .from(schema.adSlots)
      .where(eq(schema.adSlots.id, slotId))
      .limit(1);

    if (existing.length > 0) {
      return errorResponse("CONFLICT", `Ad slot with id '${slotId}' already exists`, null, 409);
    }

    const newRecord = {
      id: slotId,
      name: data.name.trim(),
      position: data.position,
      network: data.network || "adsense",
      adClient: data.ad_client?.trim() || null,
      adSlot: data.ad_slot?.trim() || null,
      format: data.format || "auto",
      responsive: data.responsive !== false,
      status: data.status || "active",
      showOn: data.show_on || "all",
      excludeSlugs: data.exclude_slugs || [],
      customCode: data.custom_code?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.adSlots).values(newRecord);
    await invalidateAdPlacementsCache();

    return NextResponse.json(
      {
        success: true,
        data: formatAdSlotResponse(newRecord),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating ad slot:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to create ad slot", null, 500);
  }
}
