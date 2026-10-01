import { count, eq, desc } from "drizzle-orm";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";
import { db, schema } from "@/db";

export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Admin session required", null, 401);
  }

  try {
    const [
      totalPosts,
      draftPosts,
      publishedPosts,
      scheduledPosts,
      totalMedia,
      totalPages,
      totalKeys,
      recentPosts,
    ] = await Promise.all([
      db.select({ count: count() }).from(schema.posts),
      db.select({ count: count() }).from(schema.posts).where(eq(schema.posts.status, "draft")),
      db.select({ count: count() }).from(schema.posts).where(eq(schema.posts.status, "published")),
      db.select({ count: count() }).from(schema.posts).where(eq(schema.posts.status, "scheduled")),
      db.select({ count: count() }).from(schema.media),
      db.select({ count: count() }).from(schema.pages),
      db.select({ count: count() }).from(schema.apiKeys).where(eq(schema.apiKeys.isActive, true)),
      db
        .select({
          id: schema.posts.id,
          title: schema.posts.title,
          slug: schema.posts.slug,
          status: schema.posts.status,
          publishedAt: schema.posts.publishedAt,
          createdAt: schema.posts.createdAt,
        })
        .from(schema.posts)
        .orderBy(desc(schema.posts.createdAt))
        .limit(5),
    ]);

    return successResponse({
      stats: {
        totalPosts: totalPosts[0]?.count || 0,
        draftPosts: draftPosts[0]?.count || 0,
        publishedPosts: publishedPosts[0]?.count || 0,
        scheduledPosts: scheduledPosts[0]?.count || 0,
        totalMedia: totalMedia[0]?.count || 0,
        totalPages: totalPages[0]?.count || 0,
        activeKeys: totalKeys[0]?.count || 0,
      },
      recentPosts,
    });
  } catch (error) {
    console.error("Stats query error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to load dashboard stats", null, 500);
  }
}
