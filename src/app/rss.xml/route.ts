import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { getOrSetCache } from "@/lib/cache";

// Vercel Resource Optimization: 1-hour cache for RSS feed
export const revalidate = 3600;

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stackyup.com";

  const rssFeed = await getOrSetCache(
    "rss:feed:xml",
    async () => {
      let posts: (typeof schema.posts.$inferSelect)[] = [];
      try {
        posts = await db
          .select()
          .from(schema.posts)
          .where(eq(schema.posts.status, "published"))
          .orderBy(desc(schema.posts.publishedAt))
          .limit(30);
      } catch (err) {
        console.warn("Could not fetch posts for RSS feed during build:", err);
      }

      const rssItems = posts
        .map((post) => {
          const pubDate = post.publishedAt
            ? new Date(post.publishedAt).toUTCString()
            : new Date(post.createdAt).toUTCString();
          const link = `${baseUrl}/${post.slug}`;
          const description = post.excerpt || post.metaDescription || post.title;

          return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
        })
        .join("");

      return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>StackYup — AI Tools &amp; SaaS Reviews</title>
    <link>${baseUrl}</link>
    <description>Honest reviews, in-depth benchmarks, and comparisons of modern AI tools.</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;
    },
    3600 // 1 hour TTL
  );

  return new Response(rssFeed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
