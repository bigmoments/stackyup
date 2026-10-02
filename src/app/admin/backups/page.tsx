import { count } from "drizzle-orm";
import { db, schema } from "@/db";
import BackupsClient from "./BackupsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Backups & Data Export — StackYup Admin",
};

export default async function AdminBackupsPage() {
  const [postsCount, pagesCount, mediaCount, commentsCount] = await Promise.all([
    db.select({ count: count() }).from(schema.posts).catch(() => [{ count: 0 }]),
    db.select({ count: count() }).from(schema.pages).catch(() => [{ count: 0 }]),
    db.select({ count: count() }).from(schema.media).catch(() => [{ count: 0 }]),
    db.select({ count: count() }).from(schema.comments).catch(() => [{ count: 0 }]),
  ]);

  return (
    <BackupsClient
      stats={{
        posts: postsCount[0]?.count || 0,
        pages: pagesCount[0]?.count || 0,
        media: mediaCount[0]?.count || 0,
        comments: commentsCount[0]?.count || 0,
      }}
    />
  );
}
