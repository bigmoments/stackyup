import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { redirect } from "next/navigation";
import CommentsClient from "./CommentsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Comments Moderation — StackYup Admin",
};

export default async function AdminCommentsPage() {
  const session = await getCurrentAdmin();
  if (!session) {
    redirect("/admin/login");
  }

  const commentsList = await db
    .select({
      id: schema.comments.id,
      postId: schema.comments.postId,
      postTitle: schema.comments.postTitle,
      authorName: schema.comments.authorName,
      authorEmail: schema.comments.authorEmail,
      content: schema.comments.content,
      status: schema.comments.status,
      createdAt: schema.comments.createdAt,
      postSlug: schema.posts.slug,
      actualPostTitle: schema.posts.title,
    })
    .from(schema.comments)
    .leftJoin(schema.posts, eq(schema.comments.postId, schema.posts.id))
    .orderBy(desc(schema.comments.createdAt));

  return (
    <CommentsClient
      initialComments={commentsList.map((c) => ({
        id: c.id,
        postId: c.postId,
        postTitle: c.actualPostTitle || c.postTitle || "StackYup Article",
        postSlug: c.postSlug || null,
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        content: c.content,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
