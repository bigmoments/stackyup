import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import PageEditor, { PageEditorData, PageRevisionItem } from "@/components/admin/PageEditor";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Edit Static Page — StackYup CMS Admin",
};

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;

  const records = await db
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.id, id))
    .limit(1);

  if (records.length === 0) {
    notFound();
  }

  const page = records[0];

  // Fetch revisions for this page
  const pageRevisions = await db
    .select()
    .from(schema.revisions)
    .where(eq(schema.revisions.pageId, page.id))
    .orderBy(desc(schema.revisions.createdAt))
    .limit(10);

  const initialData: PageEditorData = {
    id: page.id,
    title: page.title,
    slug: page.slug,
    contentHtml: page.contentHtml,
    metaDescription: page.metaDescription,
    status: page.status as "draft" | "published",
  };

  const formattedRevisions: PageRevisionItem[] = pageRevisions.map((r) => ({
    id: r.id,
    title: r.title,
    contentHtml: r.contentHtml,
    createdAt: r.createdAt,
  }));

  return (
    <PageEditor
      initialData={initialData}
      revisions={formattedRevisions}
      isEdit={true}
    />
  );
}
