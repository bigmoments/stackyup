import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { History, Clock } from "lucide-react";
import { db, schema } from "@/db";
import PostEditor, { PostEditorData } from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;

  const records = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.id, id))
    .limit(1);

  if (records.length === 0) {
    notFound();
  }

  const post = records[0];

  // Fetch revisions
  const postRevisions = await db
    .select()
    .from(schema.revisions)
    .where(eq(schema.revisions.postId, post.id))
    .orderBy(desc(schema.revisions.createdAt))
    .limit(10);

  const initialData: PostEditorData = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    contentHtml: post.contentHtml,
    excerpt: post.excerpt,
    metaDescription: post.metaDescription,
    featuredImageUrl: post.featuredImageUrl,
    featuredImageAlt: post.featuredImageAlt,
    tags: (post.tags as string[]) || [],
    faq: (post.faqJson as { question: string; answer: string }[]) || [],
    status: post.status as "draft" | "scheduled" | "published",
    publishedAt: post.publishedAt?.toISOString() || null,
  };

  return (
    <div className="space-y-8">
      <PostEditor initialData={initialData} isEdit={true} />

      {/* Revision History Section */}
      {postRevisions.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Revision History ({postRevisions.length})</h3>
          </div>

          <div className="divide-y divide-slate-800/80">
            {postRevisions.map((rev) => (
              <div key={rev.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-300 font-medium">{rev.title || post.title}</span>
                  <span className="text-slate-500">
                    — {new Date(rev.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {rev.contentHtml.length} characters
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
