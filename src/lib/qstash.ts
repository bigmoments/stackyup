import { Client, Receiver } from "@upstash/qstash";
import { db, schema } from "@/db";
import { and, eq, lte } from "drizzle-orm";
import { invalidatePostCache } from "@/lib/cache";
import { revalidatePath } from "next/cache";

/**
 * Lazy-initialized Upstash QStash Client
 */
export function getQStashClient(): Client | null {
  const token = process.env.QSTASH_TOKEN;
  if (!token) return null;
  return new Client({
    token,
    baseUrl: process.env.QSTASH_URL || "https://qstash-us-east-1.upstash.io",
  });
}

/**
 * Lazy-initialized Upstash QStash Signature Receiver
 * Used to cryptographically verify incoming webhooks from QStash
 */
export function getQStashReceiver(): Receiver | null {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!currentSigningKey || !nextSigningKey) {
    return null;
  }

  return new Receiver({
    currentSigningKey,
    nextSigningKey,
  });
}

/**
 * Core auto-publish runner:
 * Finds any posts with status 'scheduled' where publishedAt <= NOW()
 * and updates them to 'published', clears Upstash Redis cache and revalidates Next.js pages.
 */
export async function publishDueScheduledPosts(): Promise<{
  publishedCount: number;
  publishedPosts: Array<{ id: string; slug: string; title: string }>;
}> {
  const now = new Date();

  // Find posts due for publication
  let duePosts;
  try {
    duePosts = await db
      .select({
        id: schema.posts.id,
        slug: schema.posts.slug,
        title: schema.posts.title,
        publishedAt: schema.posts.publishedAt,
      })
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.status, "scheduled"),
          lte(schema.posts.publishedAt, now)
        )
      );
  } catch (err) {
    console.error("[QStash Runner] DB select duePosts failed:", err);
    throw err;
  }

  if (duePosts.length === 0) {
    return { publishedCount: 0, publishedPosts: [] };
  }

  const publishedPosts: Array<{ id: string; slug: string; title: string }> = [];

  for (const post of duePosts) {
    await db
      .update(schema.posts)
      .set({
        status: "published",
        updatedAt: now,
      })
      .where(eq(schema.posts.id, post.id));

    // Clear caches and revalidate
    await invalidatePostCache(post.slug);

    publishedPosts.push({ id: post.id, slug: post.slug, title: post.title });
  }

  return {
    publishedCount: publishedPosts.length,
    publishedPosts,
  };
}

/**
 * Optional: Schedule a delayed trigger via QStash when a post is scheduled in Admin
 */
export async function schedulePostWithQStash(postId: string, publishedAt: Date): Promise<string | null> {
  const client = getQStashClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stackyup.com";
  if (!client) return null;

  try {
    const delaySeconds = Math.max(0, Math.floor((publishedAt.getTime() - Date.now()) / 1000));
    
    // We send a message targeting our cron endpoint
    const res = await client.publishJSON({
      url: `${siteUrl}/api/cron/publish-scheduled`,
      body: { triggerSource: "qstash-post-schedule", postId },
      delay: delaySeconds,
      retries: 3,
    });

    return res.messageId;
  } catch (err) {
    console.error("[QStash] Failed to schedule delayed message:", err);
    return null;
  }
}
