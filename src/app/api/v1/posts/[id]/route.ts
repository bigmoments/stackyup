import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { cleanHtml } from "@/lib/sanitizer";
import { getUniqueSlug } from "@/lib/slug";
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
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/v1/posts/:id_atau_slug
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await verifyApiKey(request);
  if (!auth.authenticated) {
    return errorResponse("UNAUTHORIZED", auth.error || "Unauthorized", null, 401);
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

    return successResponse({
      ...post,
      url: publicUrl,
    });
  } catch (error) {
    console.error("Error retrieving post:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve post", null, 500);
  }
}

// PATCH /api/v1/posts/:id
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
      .where(or(eq(schema.posts.id, id), eq(schema.posts.slug, id)))
      .limit(1);

    if (existing.length === 0) {
      return errorResponse("NOT_FOUND", `Post '${id}' not found`, null, 404);
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

    return successResponse({
      ...updated[0],
      url: publicUrl,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update post", null, 500);
  }
}

// DELETE /api/v1/posts/:id
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await verifyApiKey(request);
  if (!auth.authenticated) {
    return errorResponse("UNAUTHORIZED", auth.error || "Unauthorized", null, 401);
  }

  const { id } = await context.params;

  try {
    const existing = await db
      .select({ id: schema.posts.id })
      .from(schema.posts)
      .where(or(eq(schema.posts.id, id), eq(schema.posts.slug, id)))
      .limit(1);

    if (existing.length === 0) {
      return errorResponse("NOT_FOUND", `Post '${id}' not found`, null, 404);
    }

    await db.delete(schema.posts).where(eq(schema.posts.id, existing[0].id));

    return successResponse({ message: `Post '${id}' deleted successfully` });
  } catch (error) {
    console.error("Error deleting post:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to delete post", null, 500);
  }
}
