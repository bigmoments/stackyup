import { MetadataRoute } from "next";
import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stackyup.com";

  // Fetch all published posts
  const posts = await db
    .select({
      slug: schema.posts.slug,
      updatedAt: schema.posts.updatedAt,
      publishedAt: schema.posts.publishedAt,
    })
    .from(schema.posts)
    .where(eq(schema.posts.status, "published"))
    .orderBy(desc(schema.posts.publishedAt));

  // Fetch all published pages
  const pages = await db
    .select({
      slug: schema.pages.slug,
      updatedAt: schema.pages.updatedAt,
    })
    .from(schema.pages)
    .where(eq(schema.pages.status, "published"));

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/${post.slug}`,
    lastModified: post.updatedAt || post.publishedAt || new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const pageEntries: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${baseUrl}/page/${page.slug}`,
    lastModified: page.updatedAt || new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...postEntries,
    ...pageEntries,
  ];
}
