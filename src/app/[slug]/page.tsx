import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { eq, desc, ne, and } from "drizzle-orm";
import { Calendar, Clock, ChevronRight, Share2, Tag, HelpCircle, ArrowLeft } from "lucide-react";
import { db, schema } from "@/db";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

// 1. Dynamic SEO Metadata Generator
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const records = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.slug, decodedSlug))
    .limit(1);

  if (records.length === 0) {
    return {
      title: "Article Not Found",
    };
  }

  const post = records[0];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stackyup.com";
  const canonicalUrl = `${baseUrl}/${post.slug}`;
  const description = post.metaDescription || post.excerpt || `${post.title} — in-depth review on StackYup.`;
  const imageUrl = post.featuredImageUrl || `${baseUrl}/og-default.png`;

  return {
    title: post.title,
    description: description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: description,
      url: canonicalUrl,
      siteName: "StackYup",
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      images: [
        {
          url: imageUrl,
          width: 1600,
          height: 900,
          alt: post.featuredImageAlt || post.title,
        },
      ],
      tags: (post.tags as string[]) || [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: description,
      images: [imageUrl],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const records = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.slug, decodedSlug))
    .limit(1);

  if (records.length === 0) {
    notFound();
  }

  const post = records[0];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stackyup.com";
  const articleUrl = `${baseUrl}/${post.slug}`;

  // Estimate reading time (~200 words per minute)
  const wordCount = post.contentHtml.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const faqItems = (post.faqJson as { question: string; answer: string }[]) || [];

  // Fetch related posts (same tag or recent)
  const relatedPosts = await db
    .select()
    .from(schema.posts)
    .where(and(eq(schema.posts.status, "published"), ne(schema.posts.id, post.id)))
    .orderBy(desc(schema.posts.publishedAt))
    .limit(3);

  // 2. Schema.org JSON-LD Structured Data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.featuredImageUrl ? [post.featuredImageUrl] : [],
    datePublished: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    dateModified: post.updatedAt?.toISOString() || post.createdAt.toISOString(),
    author: {
      "@type": "Organization",
      name: "StackYup Editorial Team",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "StackYup",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/favicon.ico`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: (post.tags as string[])?.[0] || "Articles",
        item: `${baseUrl}/?tag=${encodeURIComponent((post.tags as string[])?.[0] || "")}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: articleUrl,
      },
    ],
  };

  const faqSchema =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full space-y-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-indigo-400 transition">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          {(post.tags as string[])?.[0] && (
            <>
              <Link
                href={`/?tag=${encodeURIComponent((post.tags as string[])[0])}`}
                className="hover:text-indigo-400 transition"
              >
                {(post.tags as string[])[0]}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
          <span className="text-slate-400 truncate max-w-xs">{post.title}</span>
        </nav>

        {/* Article Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(post.tags as string[])?.map((t) => (
              <span
                key={t}
                className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
              >
                {t}
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 pt-2 pb-6 border-b border-slate-800 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </span>

            <span>•</span>

            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{readingTime} min read</span>
            </span>

            <span>•</span>

            <span>Written by StackYup Editorial</span>
          </div>
        </header>

        {/* Featured Image */}
        {post.featuredImageUrl && (
          <figure className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
            <img
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt || post.title}
              className="w-full max-h-[500px] object-cover"
              loading="eager"
            />
            {post.featuredImageAlt && (
              <figcaption className="text-center text-xs text-slate-500 py-3 bg-slate-950/60 border-t border-slate-800">
                {post.featuredImageAlt}
              </figcaption>
            )}
          </figure>
        )}

        {/* Top AdSlot */}
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-center text-slate-600 text-xs">
          <div className="w-full h-20 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 flex items-center justify-center">
            <span>AdSense Top Banner Slot</span>
          </div>
        </div>

        {/* Article Body Content */}
        <article className="prose prose-invert prose-slate sm:prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-slate-800/80 prose-h2:pb-2 prose-h3:text-xl prose-p:text-slate-300 prose-p:leading-relaxed prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-blockquote:border-l-indigo-500 prose-blockquote:bg-slate-900/40 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-table:border prose-table:border-slate-800 prose-th:bg-slate-900 prose-th:p-3 prose-td:p-3 prose-td:border prose-td:border-slate-800 prose-code:text-indigo-300 prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
          <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
        </article>

        {/* FAQ Section (Accordion & Schema JSON-LD) */}
        {faqItems.length > 0 && (
          <section className="mt-12 p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Frequently Asked Questions</h3>
                <p className="text-xs text-slate-400">Key questions answered about this review</p>
              </div>
            </div>

            <div className="divide-y divide-slate-800/80">
              {faqItems.map((item, idx) => (
                <div key={idx} className="py-4 space-y-2">
                  <h4 className="text-sm font-semibold text-slate-100 flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">Q:</span>
                    <span>{item.question}</span>
                  </h4>
                  <p className="text-xs text-slate-400 pl-5 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom AdSlot */}
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-center text-slate-600 text-xs">
          <div className="w-full h-24 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 flex items-center justify-center">
            <span>AdSense Bottom Content Slot</span>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <section className="pt-8 border-t border-slate-800 space-y-6">
            <h3 className="text-xl font-bold text-white tracking-tight">More Reviews &amp; Comparisons</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/${rel.slug}`}
                  className="rounded-2xl bg-slate-900/40 border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition group block"
                >
                  {rel.featuredImageUrl && (
                    <div className="aspect-video rounded-xl overflow-hidden bg-slate-950">
                      <img
                        src={rel.featuredImageUrl}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </div>
                  )}
                  <h5 className="font-semibold text-sm text-slate-200 group-hover:text-indigo-400 transition line-clamp-2">
                    {rel.title}
                  </h5>
                  <p className="text-xs text-slate-500">
                    {new Date(rel.publishedAt || rel.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
