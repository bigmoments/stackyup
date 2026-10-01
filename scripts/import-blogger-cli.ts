import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { XMLParser } from "fast-xml-parser";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { db, schema } from "../src/db";
import { cleanHtml } from "../src/lib/sanitizer";
import { getUniqueSlug, slugify } from "../src/lib/slug";

const DEFAULT_XML_PATH = "d:/PROJECT/GAWEAN/PROJECT/WP/Median-UI-Blogger-Template-main/StackYup.xml";

async function runBloggerMigration() {
  const xmlPath = process.argv[2] || DEFAULT_XML_PATH;
  console.log(`Starting Blogger XML Import from: ${xmlPath}`);

  if (!fs.existsSync(xmlPath)) {
    console.error(`File not found: ${xmlPath}`);
    process.exit(1);
  }

  const xmlContent = fs.readFileSync(xmlPath, "utf-8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["entry", "category", "link"].includes(name),
  });

  const parsed = parser.parse(xmlContent);
  const feed = parsed.feed;
  const entries = feed?.entry || [];
  console.log(`Found total ${entries.length} raw Atom entries in export file.`);

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

    // Extract tags
    const tags = categories
      .filter((c: any) => c["@_scheme"] === "http://www.blogger.com/atom/ns#")
      .map((c: any) => c["@_term"])
      .filter(Boolean);

    // Extract original slug from alternate link
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

    // Extract first image
    const imgMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i);
    const featuredImageUrl = imgMatch ? imgMatch[1] : null;

    // Date
    const publishedAtStr = entry.published || entry.updated;
    const publishedAt = publishedAtStr ? new Date(publishedAtStr) : new Date();

    if (isPost) {
      const existing = await db
        .select({ id: schema.posts.id })
        .from(schema.posts)
        .where(eq(schema.posts.slug, baseSlug))
        .limit(1);

      if (existing.length > 0) {
        console.log(`Skipping existing post: ${baseSlug}`);
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
        excerpt: rawTitle.length > 150 ? `${rawTitle.slice(0, 150)}...` : rawTitle,
        metaDescription: rawTitle.slice(0, 155),
        featuredImageUrl,
        featuredImageAlt: rawTitle,
        tags,
        status: "published",
        publishedAt,
      });

      console.log(`✓ Imported post: ${rawTitle} (slug: /${uniqueSlug})`);
      importedPosts++;
    } else if (isPage) {
      const existing = await db
        .select({ id: schema.pages.id })
        .from(schema.pages)
        .where(eq(schema.pages.slug, baseSlug))
        .limit(1);

      if (existing.length > 0) {
        console.log(`Skipping existing page: ${baseSlug}`);
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

      console.log(`✓ Imported page: ${rawTitle} (slug: /page/${uniqueSlug})`);
      importedPages++;
    }
  }

  console.log("\n==================================================");
  console.log("MIGRATION SUMMARY:");
  console.log(`Imported Posts: ${importedPosts}`);
  console.log(`Imported Pages: ${importedPages}`);
  console.log(`Skipped Entries (Templates, Duplicates, Comments): ${skipped}`);
  console.log("==================================================\n");
}

runBloggerMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
