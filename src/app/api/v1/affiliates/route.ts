import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { checkIdempotency, saveIdempotency } from "@/lib/idempotency";
import { formatAffiliateResponse } from "@/lib/formatters";
import { db, schema } from "@/db";

const AffiliateCreateSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  brand: z.string().min(1, "Brand is required").max(100),
  url: z.string().url("Valid destination/affiliate URL is required"),
  category: z.string().max(100).optional().nullable(),
  default_anchor_text: z.string().max(150).optional().nullable(),
  status: z.enum(["active", "inactive", "paused"]).default("active").optional(),
  disclosure_text: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/v1/affiliates - List all affiliates
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
      .from(schema.affiliates)
      .orderBy(desc(schema.affiliates.createdAt));

    return successResponse({
      affiliates: list.map(formatAffiliateResponse),
      count: list.length,
    });
  } catch (error: any) {
    console.error("Error listing affiliates:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve affiliates", null, 500);
  }
}

// POST /api/v1/affiliates - Create new affiliate partner (Supports Idempotency-Key)
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

  const idempotencyKey = request.headers.get("Idempotency-Key") || request.headers.get("idempotency-key");
  const cached = await checkIdempotency(idempotencyKey);
  if (cached.isCached) {
    return NextResponse.json(cached.body, { status: cached.status || 200 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid JSON payload in request body", null, 400);
  }

  const parsed = AffiliateCreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.flatten().fieldErrors, 422);
  }

  const data = parsed.data;
  const affiliateId =
    data.id?.trim() ||
    `aff_${data.brand.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}_${nanoid(6)}`;

  try {
    // Check if ID already exists
    const existing = await db
      .select({ id: schema.affiliates.id })
      .from(schema.affiliates)
      .where(eq(schema.affiliates.id, affiliateId))
      .limit(1);

    if (existing.length > 0) {
      return errorResponse("CONFLICT", `Affiliate partner with id '${affiliateId}' already exists`, null, 409);
    }

    const newRecord = {
      id: affiliateId,
      brand: data.brand.trim(),
      url: data.url.trim(),
      category: data.category?.trim() || null,
      defaultAnchorText: data.default_anchor_text?.trim() || data.brand.trim(),
      status: data.status || "active",
      disclosureText: data.disclosure_text?.trim() || null,
      notes: data.notes?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.affiliates).values(newRecord);

    const formatted = formatAffiliateResponse(newRecord);
    const responsePayload = {
      success: true,
      data: formatted,
    };

    if (idempotencyKey) {
      await saveIdempotency(idempotencyKey, 201, responsePayload);
    }

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error: any) {
    console.error("Error creating affiliate:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to create affiliate partner", null, 500);
  }
}
