import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { cleanHtml } from "@/lib/sanitizer";
import { getUniqueSlug } from "@/lib/slug";
import { formatPostResponse } from "@/lib/formatters";
import { invalidatePostCache } from "@/lib/cache";
import { db, schema } from "@/db";

const PostPatchSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().max(255).optional(),
  content_html: z.string().optional(),
  excerpt: z.string().max(300).optional().nullable(),
  meta_description: z.string().max(160).optional().nullable(),
  featured_image_url: z.string().optional().nullable(),
  featured_image_alt: z.string().max(255).optional().nullable(),
  tags: z.array(z.string()).optional(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  status: z.enum(["draft", "scheduled", "published"]).optional(),
  published_at: z.string().datetime({ offset: true }).optional().nullable(),
  author_name: z.string().max(100).optional().nullable(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/v1/posts/:id_atau_slug
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
  const decodedIdOrSlug = decodeURIComponent(id);

  try {
    const records = await db
      .select()
      .from(schema.posts)
      .where(or(eq(schema.posts.id, decodedIdOrSlug), eq(schema.posts.slug, decodedIdOrSlug)))
      .limit(1);

    if (records.length === 0) {
      return errorResponse("NOT_FOUND", `Post with id or slug '${decodedIdOrSlug}' not found`, null, 404);
    }

    const post = records[0];

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const publicUrl = `${protocol}://${host}/${post.slug}`;

    return successResponse(formatPostResponse(post, publicUrl));
  } catch (error) {
    console.error("Error retrieving post:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve post", null, 500);
  }
}

// PATCH /api/v1/posts/:id
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
  const decodedIdOrSlug = decodeURIComponent(id);

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

  const parsed = PostPatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.flatten().fieldErrors, 422);
  }

  const data = parsed.data;

  try {
    // 1. Find existing post
    const existing = await db
      .select()
      .from(schema.posts)
      .where(or(eq(schema.posts.id, decodedIdOrSlug), eq(schema.posts.slug, decodedIdOrSlug)))
      .limit(1);

    if (existing.length === 0) {
      return errorResponse("NOT_FOUND", `Post with id or slug '${decodedIdOrSlug}' not found`, null, 404);
    }

    const current = existing[0];
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateValues.title = data.title;
    if (data.excerpt !== undefined) updateValues.excerpt = data.excerpt;
    if (data.meta_description !== undefined) updateValues.metaDescription = data.meta_description;
    if (data.featured_image_url !== undefined) updateValues.featuredImageUrl = data.featured_image_url;
    if (data.featured_image_alt !== undefined) updateValues.featuredImageAlt = data.featured_image_alt;
    if (data.tags !== undefined) updateValues.tags = data.tags;
    if (data.faq !== undefined) updateValues.faqJson = data.faq;
    if (data.author_name !== undefined && data.author_name !== null) updateValues.authorName = data.author_name;

    // Handle slug change
    if (data.slug && data.slug !== current.slug) {
      const finalSlug = await getUniqueSlug(data.slug, "posts", current.id);
      updateValues.slug = finalSlug;
    }

    // Handle content change & sanitize
    if (data.content_html !== undefined) {
      const clean = cleanHtml(data.content_html);
      updateValues.contentHtml = clean;

      // Add revision
      await db.insert(schema.revisions).values({
        id: `rev_${nanoid(16)}`,
        postId: current.id,
        title: data.title || current.title,
        contentHtml: clean,
      });
    }

    // Handle status change
    if (data.status !== undefined) {
      updateValues.status = data.status;

      if (data.status === "published") {
        updateValues.publishedAt = data.published_at ? new Date(data.published_at) : (current.publishedAt || new Date());
      } else if (data.status === "scheduled") {
        if (!data.published_at && !current.publishedAt) {
          return errorResponse(
            "VALIDATION_ERROR",
            "Field 'published_at' is required when status is 'scheduled'",
            { status: "scheduled" },
            422
          );
        }
        if (data.published_at) {
          updateValues.publishedAt = new Date(data.published_at);
        }
      }
    } else if (data.published_at !== undefined) {
      updateValues.publishedAt = data.published_at ? new Date(data.published_at) : null;
    }

    // Update in database
    await db.update(schema.posts).set(updateValues).where(eq(schema.posts.id, current.id));

    // Fetch updated
    const updated = await db.select().from(schema.posts).where(eq(schema.posts.id, current.id)).limit(1);

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const publicUrl = `${protocol}://${host}/${updated[0].slug}`;

    // Invalidate Upstash Redis & Edge cache
    await invalidatePostCache(updated[0].slug);
    if (current.slug !== updated[0].slug) {
      await invalidatePostCache(current.slug);
    }

    if (updated[0].status === "scheduled" && updated[0].publishedAt) {
      const { schedulePostWithQStash } = await import("@/lib/qstash");
      await schedulePostWithQStash(updated[0].id, updated[0].publishedAt).catch((e) =>
        console.warn("[QStash Schedule Trigger] Note:", e)
      );
    }

    return successResponse(formatPostResponse(updated[0], publicUrl));
  } catch (error) {
    console.error("Error updating post:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update post", null, 500);
  }
}

// DELETE /api/v1/posts/:id_or_slug
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
  const decodedIdOrSlug = decodeURIComponent(id);

  try {
    const existing = await db
      .select({ id: schema.posts.id, slug: schema.posts.slug })
      .from(schema.posts)
      .where(or(eq(schema.posts.id, decodedIdOrSlug), eq(schema.posts.slug, decodedIdOrSlug)))
      .limit(1);

    if (existing.length === 0) {
      return errorResponse("NOT_FOUND", `Post with id or slug '${decodedIdOrSlug}' not found`, null, 404);
    }

    const postToDelete = existing[0];

    // Hard delete: remove associated revisions & comments first to avoid orphan records or FK constraint issues
    await db.delete(schema.revisions).where(eq(schema.revisions.postId, postToDelete.id));
    await db.delete(schema.comments).where(eq(schema.comments.postId, postToDelete.id));
    await db.delete(schema.posts).where(eq(schema.posts.id, postToDelete.id));

    // Invalidate Upstash Redis & Edge cache
    await invalidatePostCache(postToDelete.slug);

    // 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting post:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to delete post", null, 500);
  }
}
