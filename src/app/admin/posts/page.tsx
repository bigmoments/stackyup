import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import PostsListClient, { PostRowItem } from "./PostsListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Posts — StackYup Admin",
};

interface PostsPageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function AdminPostsPage({ searchParams }: PostsPageProps) {
  const { status, search } = await searchParams;

  const whereCondition =
    status && status !== "all" ? eq(schema.posts.status, status) : undefined;

  const allPosts = await db
    .select()
    .from(schema.posts)
    .where(whereCondition)
    .orderBy(desc(schema.posts.createdAt));

  const formattedPosts: PostRowItem[] = allPosts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    tags: (p.tags as string[]) || [],
    featuredImageUrl: p.featuredImageUrl,
    featuredImageAlt: p.featuredImageAlt,
    publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
    createdAt: new Date(p.createdAt).toISOString(),
  }));

  return (
    <PostsListClient
      initialPosts={formattedPosts}
      initialStatus={status || "all"}
      initialSearch={search || ""}
    />
  );
}
