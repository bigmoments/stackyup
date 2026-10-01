import { NextRequest } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getCurrentAdmin } from "@/lib/admin-session";
import { cleanHtml } from "@/lib/sanitizer";
import { getUniqueSlug, slugify } from "@/lib/slug";
import { errorResponse, successResponse } from "@/lib/response";
import { db, schema } from "@/db";

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Admin session required", null, 401);
  }

  try {
    let xmlContent = "";
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return errorResponse("VALIDATION_ERROR", "Missing XML file in 'file' field", null, 422);
      }
      xmlContent = await file.text();
    } else {
      xmlContent = await request.text();
    }

    if (!xmlContent || !xmlContent.includes("<feed")) {
      return errorResponse("VALIDATION_ERROR", "Invalid Blogger XML format. Expected Atom <feed> root.", null, 422);
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      isArray: (name) => ["entry", "category", "link"].includes(name),
    });

    const parsed = parser.parse(xmlContent);
    const feed = parsed.feed;
    const entries = feed?.entry || [];

    let importedPosts = 0;
    let importedPages = 0;
    let skipped = 0;

    for (const entry of entries) {
      const categories = entry.category || [];
      const isPost = categories.some(
        (c: any) => c["@_term"] === "http://schemas.google.com/blogger/2008/kind#post"
      );
      const isPage = categories.some(
        (c: any) => c["@_term"] === "http://schemas.google.com/blogger/2008/kind#page"
      );

      // Skip comments, settings, templates, etc.
      if (!isPost && !isPage) {
        skipped++;
        continue;
      }

      const rawTitle = typeof entry.title === "string" ? entry.title : entry.title?.["#text"] || "";
      if (!rawTitle.trim()) {
        skipped++;
        continue;
      }

      const rawContent = typeof entry.content === "string" ? entry.content : entry.content?.["#text"] || "";
      const sanitizedContent = cleanHtml(rawContent);

      // Extract labels / tags
      const tags = categories
        .filter((c: any) => c["@_scheme"] === "http://www.blogger.com/atom/ns#")
        .map((c: any) => c["@_term"])
        .filter(Boolean);

      // Extract original link / slug
      const alternateLink = (entry.link || []).find((l: any) => l["@_rel"] === "alternate");
      let baseSlug = "";
      if (alternateLink && alternateLink["@_href"]) {
        const href = alternateLink["@_href"];
        const match = href.match(/\/([^/]+)\.html$/);
        if (match && match[1]) {
          baseSlug = match[1];
        }
      }
      if (!baseSlug) {
        baseSlug = slugify(rawTitle);
      }

      // Extract first image from HTML as featured image
      const imgMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i);
      const featuredImageUrl = imgMatch ? imgMatch[1] : null;

      // Extract published date
      const publishedAtStr = entry.published || entry.updated;
      const publishedAt = publishedAtStr ? new Date(publishedAtStr) : new Date();

      if (isPost) {
        // Check if post with same slug already exists
        const existing = await db
          .select({ id: schema.posts.id })
          .from(schema.posts)
          .where(eq(schema.posts.slug, baseSlug))
          .limit(1);

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        const uniqueSlug = await getUniqueSlug(baseSlug, "posts");
        const postId = `p_${nanoid(16)}`;

        await db.insert(schema.posts).values({
          id: postId,
          title: rawTitle,
          slug: uniqueSlug,
          contentHtml: sanitizedContent,
          excerpt: rawTitle,
          metaDescription: rawTitle.slice(0, 155),
          featuredImageUrl: featuredImageUrl,
          featuredImageAlt: rawTitle,
          tags: tags,
          status: "published",
          publishedAt: publishedAt,
        });

        importedPosts++;
      } else if (isPage) {
        const existing = await db
          .select({ id: schema.pages.id })
          .from(schema.pages)
          .where(eq(schema.pages.slug, baseSlug))
          .limit(1);

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        const uniqueSlug = await getUniqueSlug(baseSlug, "pages");
        const pageId = `page_${nanoid(16)}`;

        await db.insert(schema.pages).values({
          id: pageId,
          title: rawTitle,
          slug: uniqueSlug,
          contentHtml: sanitizedContent,
          metaDescription: rawTitle.slice(0, 155),
          status: "published",
        });

        importedPages++;
      }
    }

    return successResponse({
      message: "Blogger migration import completed",
      importedPosts,
      importedPages,
      skipped,
      totalEntries: entries.length,
    });
  } catch (error) {
    console.error("Blogger XML Import error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to parse and import Blogger XML", null, 500);
  }
}
