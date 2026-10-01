import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { verifyApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { cleanHtml } from "@/lib/sanitizer";
import { getUniqueSlug } from "@/lib/slug";
import { db, schema } from "@/db";

const PagePatchSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().max(255).optional(),
  content_html: z.string().optional(),
  meta_description: z.string().max(160).optional().nullable(),
  status: z.enum(["draft", "published"]).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/v1/pages/:id
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await verifyApiKey(request);
  if (!auth.authenticated) {
    return errorResponse("UNAUTHORIZED", auth.error || "Unauthorized", null, 401);
  }

  const { id } = await context.params;
  const decodedId = decodeURIComponent(id);

  try {
    const records = await db
      .select()
      .from(schema.pages)
      .where(or(eq(schema.pages.id, decodedId), eq(schema.pages.slug, decodedId)))
      .limit(1);

    if (records.length === 0) {
      return errorResponse("NOT_FOUND", `Page '${decodedId}' not found`, null, 404);
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const publicUrl = `${protocol}://${host}/page/${records[0].slug}`;

    return successResponse({
      ...records[0],
      url: publicUrl,
    });
  } catch (error) {
    console.error("Error retrieving page:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve page", null, 500);
  }
}

// PATCH /api/v1/pages/:id
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await verifyApiKey(request);
  if (!auth.authenticated) {
    return errorResponse("UNAUTHORIZED", auth.error || "Unauthorized", null, 401);
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid JSON payload in request body", null, 400);
  }

  const parsed = PagePatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.flatten().fieldErrors, 422);
  }

  const data = parsed.data;

  try {
    const existing = await db
      .select()
      .from(schema.pages)
      .where(or(eq(schema.pages.id, id), eq(schema.pages.slug, id)))
      .limit(1);

    if (existing.length === 0) {
      return errorResponse("NOT_FOUND", `Page '${id}' not found`, null, 404);
    }

    const current = existing[0];
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateValues.title = data.title;
    if (data.meta_description !== undefined) updateValues.metaDescription = data.meta_description;
    if (data.status !== undefined) updateValues.status = data.status;

    if (data.slug && data.slug !== current.slug) {
      const finalSlug = await getUniqueSlug(data.slug, "pages", current.id);
      updateValues.slug = finalSlug;
    }

    if (data.content_html !== undefined) {
      updateValues.contentHtml = cleanHtml(data.content_html);
    }

    await db.update(schema.pages).set(updateValues).where(eq(schema.pages.id, current.id));

    const updated = await db.select().from(schema.pages).where(eq(schema.pages.id, current.id)).limit(1);

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const publicUrl = `${protocol}://${host}/page/${updated[0].slug}`;

    return successResponse({
      ...updated[0],
      url: publicUrl,
    });
  } catch (error) {
    console.error("Error updating page:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update page", null, 500);
  }
}
