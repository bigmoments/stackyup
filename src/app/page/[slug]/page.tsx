import { notFound } from "next/navigation";
import { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

export const dynamic = "force-dynamic";

interface StaticPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StaticPageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const records = await db
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.slug, decodedSlug))
    .limit(1);

  if (records.length === 0) {
    return { title: "Page Not Found" };
  }

  const page = records[0];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stackyup.com";

  return {
    title: page.title,
    description: page.metaDescription || `${page.title} — StackYup`,
    alternates: {
      canonical: `${baseUrl}/page/${page.slug}`,
    },
  };
}

export default async function StaticPage({ params }: StaticPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const records = await db
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.slug, decodedSlug))
    .limit(1);

  if (records.length === 0) {
    notFound();
  }

  const page = records[0];

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full space-y-8">
        <header className="pb-6 border-b border-slate-800">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {page.title}
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Last updated: {new Date(page.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </header>

        <article className="prose prose-invert prose-slate sm:prose-lg max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-slate-300 prose-p:leading-relaxed prose-a:text-indigo-400">
          <div dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}
