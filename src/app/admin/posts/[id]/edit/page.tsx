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
    authorName: post.authorName || "Adit",
  };

  return (
    <div className="space-y-8 font-sans">
      <PostEditor initialData={initialData} isEdit={true} />

      {/* Revision History Section */}
      {postRevisions.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE8]">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#078a4b]" />
              <h3 className="text-sm font-bold text-[#101313]">Revision History ({postRevisions.length})</h3>
            </div>
            <span className="text-xs text-[#667085]">Automatic version backups</span>
          </div>

          <div className="divide-y divide-[#E6EBE8]">
            {postRevisions.map((rev, idx) => (
              <div key={rev.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#f4fbf7] text-[#078a4b] flex items-center justify-center font-bold text-[10px]">
                    #{postRevisions.length - idx}
                  </div>
                  <div>
                    <span className="text-[#101313] font-semibold">{rev.title || post.title}</span>
                    <span className="text-[#667085] ml-2">
                      — {new Date(rev.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#8a9099] font-mono">
                    {rev.contentHtml.length.toLocaleString()} characters
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
