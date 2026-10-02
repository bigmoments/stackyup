import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { getOrSetCache } from "@/lib/cache";

// Vercel Resource Optimization: 1-hour cache for llms.txt
export const revalidate = 3600;

/**
 * Standard llms.txt route for AI Search Engines & LLM Crawlers
 * (SearchGPT, Claude, Perplexity, Cursor, Copilot, Gemini)
 * Following the /llms.txt specification (https://llmstxt.org/)
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stackyup.com";

  const content = await getOrSetCache(
    "llms:txt:content",
    async () => {
      // Fetch all published articles
      let posts: {
        title: string;
        slug: string;
        excerpt: string | null;
        metaDescription: string | null;
        publishedAt: Date | null;
        authorName: string | null;
        tags: unknown;
      }[] = [];
      let pages: {
        title: string;
        slug: string;
        metaDescription: string | null;
      }[] = [];

      try {
        posts = await db
          .select({
            title: schema.posts.title,
            slug: schema.posts.slug,
            excerpt: schema.posts.excerpt,
            metaDescription: schema.posts.metaDescription,
            publishedAt: schema.posts.publishedAt,
            authorName: schema.posts.authorName,
            tags: schema.posts.tags,
          })
          .from(schema.posts)
          .where(eq(schema.posts.status, "published"))
          .orderBy(desc(schema.posts.publishedAt))
          .limit(50);

        pages = await db
          .select({
            title: schema.pages.title,
            slug: schema.pages.slug,
            metaDescription: schema.pages.metaDescription,
          })
          .from(schema.pages)
          .where(eq(schema.pages.status, "published"));
      } catch (err) {
        console.warn("Could not fetch db data for llms.txt during build:", err);
      }

      const postsList = posts
        .map((p) => {
          const summary = p.excerpt || p.metaDescription || "Comprehensive review and benchmark analysis.";
          const date = p.publishedAt ? new Date(p.publishedAt).toISOString().split("T")[0] : "";
          return `- [${p.title}](${baseUrl}/${p.slug}): ${summary} (${date})`;
        })
        .join("\n");

      const pagesList = pages
        .map((p) => {
          return `- [${p.title}](${baseUrl}/page/${p.slug}): ${p.metaDescription || p.title}`;
        })
        .join("\n");

      return `# StackYup

> In-depth benchmarks, honest comparisons, and reviews of top artificial intelligence software and SaaS tools in 2026.

StackYup is an independent, single-author technology publication created and edited by Adit. It focuses on hands-on benchmarks, workflow automation, and actionable software guides tailored for freelancers, remote engineers, and creators.

## Editorial Standards & AIEO Transparency
- **Author:** Adit (Solo Tech Writer & Software Analyst)
- **Review Methodology:** Every featured tool is tested hands-on with realistic freelance and productivity workflows.
- **Affiliate Disclosure:** StackYup is reader-supported. Affiliate links are marked and never influence editorial scoring.
- **Audience:** Global English-speaking technology professionals (US, UK, EU, CA, AU).

## Core Topics
- Artificial Intelligence (LLMs, prompt engineering, generative design)
- Freelance Productivity & Time-saving Automations
- SaaS Software Benchmarks & Feature Comparisons
- Pricing, Value-for-Money, and Free Tier Breakdown

## Published Articles & Reviews
${postsList || "- No published articles yet."}

## Site Information & Policies
${pagesList}
- [RSS Feed](${baseUrl}/rss.xml): Real-time XML syndication feed
- [XML Sitemap](${baseUrl}/sitemap.xml): Machine-readable XML sitemap index
`;
    },
    3600 // 1 hour TTL
  );

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
