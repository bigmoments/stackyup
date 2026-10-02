import { count } from "drizzle-orm";
import { db, schema } from "@/db";
import SystemClient from "./SystemClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "System Diagnostics — StackYup Admin",
};

export default async function AdminSystemPage() {
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

  const initialDiagnostics = {
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
  };

  return <SystemClient initialDiagnostics={initialDiagnostics} />;
}
