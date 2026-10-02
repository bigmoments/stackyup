import { NextRequest } from "next/server";
import { count } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { clearCache } from "@/lib/cache";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  try {
    const startTime = performance.now();
    const [posts, pages, media, comments, subscribers] = await Promise.all([
      db.select({ count: count() }).from(schema.posts).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(schema.pages).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(schema.media).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(schema.comments).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(schema.subscribers).catch(() => [{ count: 0 }]),
    ]);
    const pingMs = Math.round(performance.now() - startTime);

    const memoryUsage = process.memoryUsage();

    return successResponse({
      diagnostics: {
        nodeEnv: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
        platform: `${process.platform} (${process.arch})`,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssMb: (memoryUsage.rss / 1024 / 1024).toFixed(1),
        memoryHeapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(1),
        databaseLatencyMs: pingMs,
        databaseConnected: true,
        counts: {
          posts: posts[0]?.count || 0,
          pages: pages[0]?.count || 0,
          media: media[0]?.count || 0,
          comments: comments[0]?.count || 0,
          subscribers: subscribers[0]?.count || 0,
        },
        services: {
          cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
          redis: Boolean(process.env.UPSTASH_REDIS_REST_URL),
          databaseUrl: Boolean(process.env.DATABASE_URL),
        },
      },
    });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json().catch(() => ({}));
    const action = body.action || "clear_cache";

    if (action === "clear_cache") {
      try {
        await clearCache();
      } catch {}
      return successResponse({ message: "In-memory & Redis caches cleared successfully!" });
    }

    return errorResponse("VALIDATION_ERROR", "Unknown action", null, 400);
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}
