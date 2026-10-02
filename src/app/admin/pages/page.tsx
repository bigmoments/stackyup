import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import PagesClient, { PageItem } from "./PagesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Static Pages — StackYup Admin",
};

export default async function AdminPagesPage() {
  const pagesList = await db
    .select()
    .from(schema.pages)
    .orderBy(desc(schema.pages.createdAt));

  const formattedPages: PageItem[] = pagesList.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    contentHtml: p.contentHtml,
    metaDescription: p.metaDescription,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  return <PagesClient initialPages={formattedPages} />;
}
