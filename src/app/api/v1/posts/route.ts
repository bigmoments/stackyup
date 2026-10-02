import { NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { desc, eq, count, and, or, ilike } from "drizzle-orm";
import { verifyApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { cleanHtml } from "@/lib/sanitizer";
import { getUniqueSlug } from "@/lib/slug";
import { checkIdempotency, saveIdempotency } from "@/lib/idempotency";
import { formatPostResponse } from "@/lib/formatters";
import { invalidatePostCache } from "@/lib/cache";
import { db, schema } from "@/db";

const PostCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string().max(255).optional(),
  content_html: z.string().min(1, "content_html is required"),
  excerpt: z.string().max(300).optional(),
  meta_description: z.string().max(160).optional(),
  featured_image_url: z.string().optional().nullable(),
  featured_image_alt: z.string().max(255).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional().default([]),
  status: z.enum(["draft", "scheduled", "published"]).optional().default("draft"),
  published_at: z.string().datetime({ offset: true }).optional().nullable(),
  author_name: z.string().max(100).optional().nullable(),
});

// POST /api/v1/posts - Create post
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

  // Idempotency check
  const idempotencyKey = request.headers.get("Idempotency-Key") || request.headers.get("idempotency-key");
  if (idempotencyKey) {
    const cached = await checkIdempotency(idempotencyKey);
    if (cached.isCached) {
      return successResponse(cached.body, cached.status || 201);
    }
  }

  let body: any;
  try {
    body = await request.json();
    if (body && typeof body === "object") {
      if (body.content_html === undefined && typeof body.html === "string") {
        body.content_html = body.html;
      }
    }
  } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid JSON payload in request body", null, 400);
  }

  const parsed = PostCreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.flatten().fieldErrors, 422);
  }

  const data = parsed.data;

  // Validation: if status is 'scheduled', published_at is required
  if (data.status === "scheduled" && !data.published_at) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Field 'published_at' is required when status is 'scheduled'",
      { status: "scheduled", published_at: null },
      422
    );
  }

  try {
    // 1. Generate or validate slug
    const finalSlug = await getUniqueSlug(data.slug || data.title, "posts");

    // 2. Sanitize HTML content with strict allowlist
    const sanitizedHtml = cleanHtml(data.content_html);

    // 3. Determine publishedAt timestamp
    let publishedAtDate: Date | null = null;
    if (data.status === "published") {
      publishedAtDate = data.published_at ? new Date(data.published_at) : new Date();
    } else if (data.status === "scheduled" && data.published_at) {
      publishedAtDate = new Date(data.published_at);
    }

    const postId = `p_${nanoid(16)}`;

    // 4. Insert into database
    await db.insert(schema.posts).values({
      id: postId,
      title: data.title,
      slug: finalSlug,
      contentHtml: sanitizedHtml,
      excerpt: data.excerpt || null,
      metaDescription: data.meta_description || null,
      featuredImageUrl: data.featured_image_url || null,
      featuredImageAlt: data.featured_image_alt || null,
      tags: data.tags || [],
      faqJson: data.faq || [],
      status: data.status,
      publishedAt: publishedAtDate,
      authorName: data.author_name ? data.author_name.trim() : null,
    });

    // 5. Create initial revision record
    await db.insert(schema.revisions).values({
      id: `rev_${nanoid(16)}`,
      postId: postId,
      title: data.title,
      contentHtml: sanitizedHtml,
    });

    // Base URL determination
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const publicUrl = `${protocol}://${host}/${finalSlug}`;

    const responsePayload = {
      id: postId,
      slug: finalSlug,
      url: publicUrl,
      status: data.status,
    };

    // Save idempotency key if provided
    if (idempotencyKey) {
      await saveIdempotency(idempotencyKey, 201, responsePayload);
    }

    // Invalidate Upstash Redis and Edge cache if published
    if (data.status === "published") {
      await invalidatePostCache(finalSlug);
    } else if (data.status === "scheduled" && publishedAtDate) {
      // Trigger QStash delayed message as backup trigger
      const { schedulePostWithQStash } = await import("@/lib/qstash");
      await schedulePostWithQStash(postId, publishedAtDate).catch((e) =>
        console.warn("[QStash Schedule Trigger] Note:", e)
      );
    }

    return successResponse(responsePayload, 201);
  } catch (error) {
    console.error("Error creating post:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to create post", null, 500);
  }
}

// GET /api/v1/posts - List posts with filters
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
    const statusFilter = searchParams.get("status");
    const qParam = searchParams.get("q") || searchParams.get("search");
    const tagParam = searchParams.get("tag");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    const conditions = [];

    if (statusFilter && statusFilter !== "all") {
      conditions.push(eq(schema.posts.status, statusFilter));
    }

    if (qParam && qParam.trim()) {
      const searchPattern = `%${qParam.trim()}%`;
      conditions.push(
        or(
          ilike(schema.posts.title, searchPattern),
          ilike(schema.posts.slug, searchPattern),
          ilike(schema.posts.excerpt, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [items, total] = await Promise.all([
      db
        .select()
        .from(schema.posts)
        .where(whereClause)
        .orderBy(desc(schema.posts.createdAt))
        .limit(limit)
        .offset(offset),
      whereClause
        ? db.select({ value: count() }).from(schema.posts).where(whereClause)
        : db.select({ value: count() }).from(schema.posts),
    ]);

    // Optional in-memory tag filter if requested
    const filteredItems = tagParam && tagParam.trim()
      ? items.filter((p) => {
          const tags = Array.isArray(p.tags) ? (p.tags as string[]) : [];
          return tags.some((t) => t.toLowerCase() === tagParam.trim().toLowerCase());
        })
      : items;

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";

    return successResponse({
      items: filteredItems.map((p) => formatPostResponse(p, `${protocol}://${host}/${p.slug}`)),
      pagination: {
        limit,
        offset,
        total: tagParam ? filteredItems.length : total[0]?.value || 0,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/v1/posts:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve posts", null, 500);
  }
}
