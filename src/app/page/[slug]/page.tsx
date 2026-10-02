import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getOrSetCache } from "@/lib/cache";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

// 100% Free Tier Optimization: Pure On-Demand SSG for static policy & about pages
export const revalidate = false;

export async function generateStaticParams() {
  try {
    const pages = await db
      .select({ slug: schema.pages.slug })
      .from(schema.pages)
      .where(eq(schema.pages.status, "published"))
      .limit(50);

    return pages.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

interface StaticPageProps {
  params: Promise<{ slug: string }>;
}

async function getStaticPageBySlug(decodedSlug: string) {
  return getOrSetCache(
    `page:slug:${decodedSlug}`,
    async () => {
      const records = await db
        .select()
        .from(schema.pages)
        .where(eq(schema.pages.slug, decodedSlug))
        .limit(1);
      return records[0] || null;
    },
    86400 // 24 hours TTL
  );
}

export async function generateMetadata({ params }: StaticPageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const page = await getStaticPageBySlug(decodedSlug);

  if (!page) {
    return { title: "Page Not Found" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stackyup.com";
  const canonicalUrl = `${baseUrl}/page/${page.slug}`;
  const description = page.metaDescription || `${page.title} — StackYup official policy and documentation.`;

  return {
    title: page.title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${page.title} — StackYup`,
      description,
      url: canonicalUrl,
      siteName: "StackYup",
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      title: `${page.title} — StackYup`,
      description,
    },
  };
}

export default async function StaticPage({ params }: StaticPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const page = await getStaticPageBySlug(decodedSlug);

  if (!page) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stackyup.com";
  const pageUrl = `${baseUrl}/page/${page.slug}`;

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": page.slug === "about" ? "AboutPage" : page.slug === "contact" ? "ContactPage" : "WebPage",
    name: page.title,
    description: page.metaDescription || `${page.title} — StackYup`,
    url: pageUrl,
    inLanguage: "en-US",
    publisher: {
      "@type": "Organization",
      name: "StackYup",
      url: baseUrl,
    },
    dateModified: page.updatedAt?.toISOString() || page.createdAt.toISOString(),
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-[#242424]">
      {/* Schema.org WebPage Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      <PublicNavbar />

      <main className="flex-1 max-w-[760px] mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Subtle Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#6b6b6b] hover:text-[#242424] transition group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to home</span>
          </Link>
        </div>

        <header className="pb-6 mb-8 border-b border-[#e8ece9]">
          <h1 className="font-bold text-3xl sm:text-4xl md:text-5xl text-[#101313] tracking-tight">
            {page.title}
          </h1>
          <p className="text-xs text-[#667085] mt-3">
            Last updated:{" "}
            {new Date(page.updatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </header>

        <article className="medium-prose">
          <div dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}

