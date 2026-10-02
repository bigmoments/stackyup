import { NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { desc, count } from "drizzle-orm";
import { verifyApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { cleanHtml } from "@/lib/sanitizer";
import { getUniqueSlug } from "@/lib/slug";
import { db, schema } from "@/db";

const PageCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string().max(255).optional(),
  content_html: z.string().min(1, "content_html is required"),
  meta_description: z.string().max(160).optional(),
  status: z.enum(["draft", "published"]).optional().default("draft"),
});

// POST /api/v1/pages - Create static page
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid JSON payload in request body", null, 400);
  }

  const parsed = PageCreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.flatten().fieldErrors, 422);
  }

  const data = parsed.data;

  try {
    const finalSlug = await getUniqueSlug(data.slug || data.title, "pages");
    const sanitizedHtml = cleanHtml(data.content_html);
    const pageId = `page_${nanoid(16)}`;

    await db.insert(schema.pages).values({
      id: pageId,
      title: data.title,
      slug: finalSlug,
      contentHtml: sanitizedHtml,
      metaDescription: data.meta_description || null,
      status: data.status,
    });

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const publicUrl = `${protocol}://${host}/page/${finalSlug}`;

    return successResponse(
      {
        id: pageId,
        slug: finalSlug,
        url: publicUrl,
        status: data.status,
      },
      201
    );
  } catch (error) {
    console.error("Error creating page:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to create page", null, 500);
  }
}

// GET /api/v1/pages - List static pages
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
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    const [items, total] = await Promise.all([
      db
        .select()
        .from(schema.pages)
        .orderBy(desc(schema.pages.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(schema.pages),
    ]);

    return successResponse({
      items,
      pagination: {
        limit,
        offset,
        total: total[0]?.value || 0,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/v1/pages:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve pages", null, 500);
  }
}
