import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { eq, desc, ne, and } from "drizzle-orm";
import {
  Headphones,
  ArrowLeft,
  MessageCircle,
  HelpCircle,
  MoreHorizontal,
  Clock,
  Calendar,
  UserPlus,
  Info,
  Home,
  Eye,
  Lightbulb,
  Check,
} from "lucide-react";
import { db, schema } from "@/db";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";
import MediumClapButton from "@/components/public/MediumClapButton";
import MediumBookmarkButton from "@/components/public/MediumBookmarkButton";
import MediumShareButton from "@/components/public/MediumShareButton";
import MediumCommentsSection from "@/components/public/MediumCommentsSection";
import TableOfContents from "@/components/public/TableOfContents";
import MobileReadingBar from "@/components/public/MobileReadingBar";
import AdSlot from "@/components/public/AdSlot";
import ArticleLeftNav from "@/components/public/ArticleLeftNav";
import ArticleRightSidebar from "@/components/public/ArticleRightSidebar";
import { calculateReadingTime, calculateWordCount } from "@/lib/reading-time";
import { extractAndInjectToc } from "@/lib/toc";
import { injectInArticleAds } from "@/lib/ads";
import { getOrSetCache } from "@/lib/cache";
import { expandShortcodes, hasAffiliateShortcodes } from "@/lib/shortcodes";

// 100% Free Tier Optimization: Pure On-Demand SSG.
// Revalidates ONLY on CMS publish/update/delete events via revalidatePath
export const revalidate = false;

export async function generateStaticParams() {
  try {
    const posts = await db
      .select({ slug: schema.posts.slug })
      .from(schema.posts)
      .where(eq(schema.posts.status, "published"))
      .limit(100);

    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

async function getPostBySlug(decodedSlug: string) {
  return getOrSetCache(
    `posts:slug:${decodedSlug}`,
    async () => {
      const records = await db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.slug, decodedSlug))
        .limit(1);
      return records[0] || null;
    },
    600 // 10 minutes TTL
  );
}

// 1. Dynamic SEO & AIEO Metadata Generator
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const post = await getPostBySlug(decodedSlug);

  if (!post) {
    return { title: "Article Not Found" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stackyup.com";
  const canonicalUrl = `${baseUrl}/${post.slug}`;
  const description = post.metaDescription || post.excerpt || `${post.title} — in-depth review by Adit on StackYup.`;
  const imageUrl = post.featuredImageUrl || `${baseUrl}/og-default.png`;
  const primaryTag = ((post.tags as string[]) || [])[0] || "AI Tools";
  const authorName = post.authorName || "Adit";

  return {
    title: post.title,
    description,
    keywords: (post.tags as string[]) || ["AI Tools", "SaaS Reviews", "Automation", "Freelance Productivity"],
    authors: [{ name: authorName, url: `${baseUrl}/page/about` }],
    creator: authorName,
    publisher: "StackYup",
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: post.title,
      description,
      url: canonicalUrl,
      siteName: "StackYup",
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      authors: [authorName],
      section: primaryTag,
      tags: (post.tags as string[]) || [],
      images: [
        {
          url: imageUrl,
          width: 1600,
          height: 900,
          alt: post.featuredImageAlt || post.title,
        },
      ],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [imageUrl],
      creator: "@stackyup",
    },
    other: {
      "article:published_time": post.publishedAt?.toISOString() || post.createdAt.toISOString(),
      "article:modified_time": post.updatedAt?.toISOString() || post.createdAt.toISOString(),
      "article:author": authorName,
      "article:section": primaryTag,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const post = await getPostBySlug(decodedSlug);

  if (!post) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stackyup.com";
  const articleUrl = `${baseUrl}/${post.slug}`;

  // 1. Accurate word count & reading time
  const readingTime = calculateReadingTime(post.contentHtml);
  const wordCount = calculateWordCount(post.contentHtml);

  // 2. Author info resolution (3-tier: Post author_name -> Site Settings default_author_name -> fallback "Adit")
  let authorName = post.authorName;
  if (!authorName) {
    const authorSetting = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "default_author_name"))
      .limit(1);
    authorName = authorSetting[0]?.value || "Adit";
  }
  const authorInitial = authorName.charAt(0).toUpperCase();

  // 3. Shortcode expansion ([affiliate id="..."] & [img id="..."])
  const hasAffiliate =
    hasAffiliateShortcodes(post.contentHtml) ||
    post.contentHtml.includes('rel="sponsored') ||
    post.contentHtml.includes("/api/affiliates/redirect");
  const postHtmlWithShortcodes = await expandShortcodes(post.contentHtml);

  // 4. Auto-ToC parsing and anchor injection
  const { headings, enhancedHtml } = extractAndInjectToc(postHtmlWithShortcodes);

  // 5. In-article automated ad placement
  const contentWithAds = injectInArticleAds(enhancedHtml);

  const faqItems = (post.faqJson as { question: string; answer: string }[]) || [];
  const tagsList = (post.tags as string[]) || [];
  const primaryTag = tagsList[0] || "AI Tools";

  // 5. Fetch real comments from DB
  const commentsRecords = await db
    .select()
    .from(schema.comments)
    .where(and(eq(schema.comments.postId, post.id), eq(schema.comments.status, "approved")))
    .orderBy(desc(schema.comments.createdAt))
    .catch((err) => {
      console.error("Comments fetch error:", err);
      return [];
    });

  // 6. Fetch related posts (cached)
  const rawRelatedPosts = await getOrSetCache(
    `posts:related:${post.id}`,
    async () => {
      return db
        .select()
        .from(schema.posts)
        .where(and(eq(schema.posts.status, "published"), ne(schema.posts.id, post.id)))
        .orderBy(desc(schema.posts.publishedAt))
        .limit(4);
    },
    600 // 10 minutes TTL
  );

  const relatedPosts = rawRelatedPosts.map((p) => ({
    ...p,
    readingTime: calculateReadingTime(p.contentHtml),
  }));

  // Schema.org Structured Data: 1. TechArticle Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: post.title,
    alternativeHeadline: post.excerpt || undefined,
    description: post.metaDescription || post.excerpt,
    inLanguage: "en-US",
    image: post.featuredImageUrl ? [post.featuredImageUrl] : [],
    datePublished: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    dateModified: post.updatedAt?.toISOString() || post.createdAt.toISOString(),
    wordCount,
    timeRequired: `PT${readingTime}M`,
    keywords: tagsList.join(", "),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["#article-title", "#article-excerpt", ".ai-summary-text", "#article-body"],
    },
    author: {
      "@type": "Person",
      name: authorName,
      jobTitle: "Tech Writer & Software Reviewer",
      url: `${baseUrl}/page/about`,
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

  // Schema.org Structured Data: 2. Breadcrumbs Schema
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
        name: primaryTag,
        item: `${baseUrl}/?tag=${encodeURIComponent(primaryTag)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: articleUrl,
      },
    ],
  };

  // Schema.org Structured Data: 3. FAQPage Schema
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

  const publishDateStr = new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-[#242424]">
      {/* Schema.org TechArticle Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {/* Schema.org BreadcrumbList Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Schema.org FAQPage Structured Data */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <PublicNavbar />

      {/* Main Container: 3-Column Architectural Layout on Wide Desktop (Section 1: 270px | 700px | 310px, gap 36px) */}
      <main className="flex-1 w-full max-w-[1420px] mx-auto px-4 sm:px-6 pt-6 pb-20">
        <div className="flex flex-col lg:flex-row xl:grid xl:grid-cols-[270px_minmax(0,700px)_310px] gap-8 xl:gap-[36px] items-start justify-center">
          {/* 1. LEFT SIDEBAR: Navigasi Pembaca (270px, sticky at top 88px, visible on xl) */}
          <aside className="hidden xl:block w-[270px] sticky top-[88px] self-start max-h-[calc(100vh-110px)] overflow-y-auto no-scrollbar">
            <ArticleLeftNav
              headings={headings}
              relatedPosts={relatedPosts}
            />
          </aside>

          {/* 2. CENTER COLUMN: Main Article (650-700px wide, pure tranquil reading experience) */}
          <div className="flex-1 w-full max-w-[700px] mx-auto min-w-0">
            {/* Breadcrumb Navigation (Section 9: 12-13px muted gray, gap to tags 18px) */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#8a9099] mb-[18px]">
              <Link href="/" className="hover:text-[#079653] transition flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                <span className="sr-only">Home</span>
              </Link>
              <span>›</span>
              <Link
                href={`/?tag=${encodeURIComponent(primaryTag)}`}
                className="hover:text-[#079653] transition font-medium"
              >
                {primaryTag}
              </Link>
              <span>›</span>
              <span className="text-[#667085] truncate max-w-[130px] sm:max-w-xs md:max-w-md">
                {post.title}
              </span>
            </nav>

            {/* Category / Tag Badges (Section 10: Primary green pill, secondary soft gray, height 32px, gap to H1 18px) */}
            <div className="flex flex-wrap items-center gap-2 mb-[18px]">
              <Link
                href={`/?tag=${encodeURIComponent(primaryTag)}`}
                className="h-[32px] px-[14px] inline-flex items-center rounded-full text-[12.5px] font-semibold bg-[#079653] text-white hover:bg-[#057842] transition shadow-2xs"
              >
                {primaryTag}
              </Link>
              {tagsList.slice(1).map((t) => (
                <Link
                  key={t}
                  href={`/?tag=${encodeURIComponent(t)}`}
                  className="h-[32px] px-[14px] inline-flex items-center rounded-full text-[12.5px] font-medium bg-[#f2f4f5] text-[#596579] hover:bg-[#e4e7e5] hover:text-[#101313] transition"
                >
                  {t}
                </Link>
              ))}
            </div>

            {/* Article Header */}
            <header className="mb-[24px]">
              <h1
                id="article-title"
                className="font-bold text-[34px] sm:text-[44px] md:text-[48px] xl:text-[52px] leading-[1.04] text-[#101313] tracking-[-0.035em] font-sans mb-[14px]"
              >
                {post.title}
              </h1>

              {(post.excerpt || post.metaDescription) && (
                <p
                  id="article-excerpt"
                  className="font-sans text-[18px] sm:text-[19px] text-[#667085] leading-[1.5] font-normal mb-[22px]"
                >
                  {post.excerpt || post.metaDescription}
                </p>
              )}

              {/* Author Byline & Metrics (Section 13: 44x44 avatar, compact row, metadata gap to hero 24px) */}
              <div className="pt-3 pb-5 border-b border-[#e6ebe8] space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <div className="w-[44px] h-[44px] rounded-full bg-[#101313] text-white flex items-center justify-center font-bold text-base shrink-0">
                    {authorInitial}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-bold text-[#101313] text-[13.5px]">{authorName}</span>
                      <button
                        type="button"
                        className="font-medium text-[#079653] hover:text-[#057842] transition cursor-pointer text-xs"
                      >
                        • Follow
                      </button>
                    </div>
                    <p className="text-[12px] text-[#8a9099]">Founder &amp; Tech Researcher</p>
                  </div>
                </div>

                {/* Metrics & Actions */}
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-x-3.5 gap-y-2 text-xs text-[#667085] pt-1 sm:pt-0">
                  <div className="flex items-center gap-2 text-xs">
                    <time dateTime={post.publishedAt?.toISOString()} className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#8a9099]" />
                      <span>{publishDateStr}</span>
                    </time>
                    <span className="text-[#8a9099]">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#8a9099]" />
                      <span>{readingTime} min read</span>
                    </span>
                    <span className="text-[#8a9099]">•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-[#8a9099]" />
                      <span>55</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href="#responses"
                      className="flex items-center gap-1 hover:text-[#101313] transition p-1"
                      title="Jump to responses"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#8a9099]" />
                      <span>{commentsRecords.length}</span>
                    </a>
                    <MediumBookmarkButton slug={post.slug} size="sm" />
                    <MediumShareButton url={articleUrl} title={post.title} />
                  </div>
                </div>
              </div>
            </header>

            {/* Hero Image (Section 14: 16:9, radius 10px, caption mt 8px, gap to takeaways 24px) */}
            {post.featuredImageUrl && (
              <figure className="mb-[24px]">
                <div className="overflow-hidden rounded-[10px] bg-[#f8faf9] aspect-video w-full border border-[#e6ebe8]">
                  <img
                    src={post.featuredImageUrl}
                    alt={post.featuredImageAlt || post.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
                <figcaption className="text-center text-[12px] text-[#8a9099] mt-[8px] font-sans italic">
                  {post.featuredImageAlt || "A modern workspace with essential AI tools for freelancers in 2026"}
                </figcaption>
              </figure>
            )}

            {/* Key Takeaways Box (Matching Mockup 1) */}
            <div
              id="ai-key-takeaways"
              className="mb-[26px] p-5 sm:p-6 rounded-2xl bg-[#f2fbf6] border border-[#d3ecdd] shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            >
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#e3f7ec] text-[#079653] flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4.5 h-4.5 text-[#079653]" />
                </div>
                <h3 className="font-bold text-[16px] text-[#076b3c] font-sans">
                  Key Takeaways
                </h3>
              </div>

              <ul className="space-y-2.5 text-[14px] text-[#374151] leading-[1.6] font-sans">
                <li className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#079653] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>7 AI tools that actually help freelancers work smarter</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#079653] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Real use cases, strengths, and limitations</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#079653] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Tips to integrate them into your workflow</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#079653] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>A practical comparison to help you choose the right tools</span>
                </li>
              </ul>
            </div>

            {/* Inline Table of Contents (Visible on Mobile/Tablet or Single Column) */}
            <div className="xl:hidden">
              <TableOfContents headings={headings} />
            </div>

            {/* FTC & AdSense Affiliate Disclosure: Placed Conspicuously BEFORE Article Body */}
            {hasAffiliate && (
              <div className="mb-6 p-3.5 rounded-xl bg-[#f8faf9] border border-[#e8ece9] text-xs text-[#667085] flex items-start sm:items-center gap-2.5 shadow-2xs">
                <Info className="w-4 h-4 text-[#078a4b] shrink-0 mt-0.5 sm:mt-0" />
                <p className="leading-relaxed">
                  <span className="text-[#101313] font-semibold">Affiliate Disclosure:</span>{" "}
                  StackYup is reader-supported. When you purchase through links on our site, we may earn an affiliate commission at no extra cost to you.{" "}
                  <Link
                    href="/page/disclaimer"
                    className="text-[#101313] underline underline-offset-2 hover:text-[#078a4b] font-medium"
                  >
                    Learn more
                  </Link>.
                </p>
              </div>
            )}

            {/* Enhanced Article Body with Automated Ads & Green Bar H2 Headings */}
            <article id="article-body" className="medium-prose">
              <div dangerouslySetInnerHTML={{ __html: contentWithAds }} />
            </article>

            {/* FAQ Section */}
            {faqItems.length > 0 && (
              <section id="article-faq" className="mt-14 pt-8 border-t border-[#e8ece9] space-y-6">
                <div className="flex items-center gap-2 text-[#101313]">
                  <HelpCircle className="w-5 h-5 text-[#078a4b]" />
                  <h3 className="font-bold text-xl sm:text-2xl text-[#101313]">
                    Frequently Asked Questions
                  </h3>
                </div>

                <div className="divide-y divide-[#e8ece9]">
                  {faqItems.map((item, idx) => (
                    <div key={idx} className="py-4 space-y-2">
                      <h4 className="font-semibold text-sm sm:text-base text-[#101313]">
                        {item.question}
                      </h4>
                      <p className="text-sm sm:text-[15px] text-[#667085] leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tags Row */}
            <div className="mt-10 pt-6 flex flex-wrap items-center gap-2">
              {tagsList.map((t) => (
                <Link
                  key={t}
                  href={`/?tag=${encodeURIComponent(t)}`}
                  className="px-3.5 py-1.5 rounded-full bg-[#f4fbf7] hover:bg-[#078a4b] hover:text-white text-[#078a4b] border border-[#e8ece9] text-xs sm:text-sm font-medium transition-colors"
                >
                  {t}
                </Link>
              ))}
            </div>

            {/* Bottom Action Bar */}
            <div className="border-y border-[#e8ece9] py-2.5 my-8 flex items-center justify-between text-[#667085]">
              <div className="flex items-center gap-4">
                <MediumClapButton
                  postId={post.id}
                  initialClaps={post.claps || 0}
                  size="md"
                />

                <a
                  href="#responses"
                  className="flex items-center gap-1.5 text-xs sm:text-sm hover:text-[#101313] transition p-1.5 rounded-full"
                >
                  <MessageCircle className="w-4.5 h-4.5" />
                  <span className="tabular-nums font-medium">
                    {commentsRecords.length}
                  </span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                <MediumBookmarkButton slug={post.slug} size="md" />
                <MediumShareButton url={articleUrl} title={post.title} />
              </div>
            </div>

            {/* Bottom Article Ad Slot (Google AdSense Responsive Multiplex / Display) */}
            <AdSlot variant="bottom-article" slotId="bottom-article-display" />

            {/* Author Bio Box */}
            <div className="p-6 sm:p-7 rounded-2xl bg-[#f4fbf7] border border-[#e8ece9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 my-10">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#101313] text-white flex items-center justify-center text-2xl font-bold shrink-0">
                  {authorInitial}
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-wider text-[#078a4b] font-semibold">
                    Written by
                  </span>
                  <h4 className="font-bold text-lg text-[#101313]">
                    {authorName}
                  </h4>
                  <p className="text-xs text-[#667085] max-w-md leading-relaxed">
                    Independent developer &amp; tech researcher. Building benchmarks and honest breakdowns for solo creators and engineering teams.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white transition text-xs font-semibold shrink-0 cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Follow</span>
              </button>
            </div>

            {/* Interactive Persistent Comments (Point 13) */}
            <div id="responses">
              <MediumCommentsSection
                postId={post.id}
                initialComments={commentsRecords}
              />
            </div>
          </div>

          {/* 3. RIGHT SIDEBAR: Monetisasi + Discovery (Section 18 & 1: 310px, visible on lg & xl) */}
          <aside className="hidden lg:block w-[300px] xl:w-[310px] sticky top-[88px] self-start shrink-0">
            <ArticleRightSidebar
              recommendedPosts={relatedPosts}
            />
          </aside>
        </div>
      </main>

      {/* "More from StackYup" Recommended Stories */}
      {relatedPosts.length > 0 && (
        <section className="bg-[#f8faf9] border-t border-[#e8ece9] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h3 className="font-bold text-xl sm:text-2xl text-[#101313] mb-8">
              More from StackYup
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.slice(0, 3).map((rel) => (
                <article key={rel.id} className="space-y-3 group">
                  {rel.featuredImageUrl && (
                    <Link
                      href={`/${rel.slug}`}
                      className="block aspect-video overflow-hidden rounded-xl bg-[#f0f0f0] border border-[#e8ece9] shadow-xs"
                    >
                      <img
                        src={rel.featuredImageUrl}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-104 transition duration-300"
                        loading="lazy"
                      />
                    </Link>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-[#667085]">
                    <div className="w-4 h-4 rounded-full bg-[#101313] text-white flex items-center justify-center text-[9px] font-bold">
                      {authorInitial}
                    </div>
                    <span>{authorName}</span>
                    <span>•</span>
                    <time dateTime={rel.publishedAt?.toISOString()}>
                      {new Date(rel.publishedAt || rel.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>

                  <h4 className="font-bold text-base sm:text-lg text-[#101313] group-hover:text-[#078a4b] transition line-clamp-2 leading-snug">
                    <Link href={`/${rel.slug}`}>{rel.title}</Link>
                  </h4>

                  <p className="text-xs text-[#667085] line-clamp-2 leading-relaxed">
                    {rel.excerpt || rel.metaDescription || "Read more about this benchmark."}
                  </p>

                  <div className="text-[11px] text-[#8a9099] pt-1">
                    {rel.readingTime} min read
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mobile Floating Reading Bar (1-tap clap, comments, bookmark, and share on mobile) */}
      <MobileReadingBar
        postId={post.id}
        initialClaps={post.claps || 0}
        commentsCount={commentsRecords.length}
        slug={post.slug}
        title={post.title}
        articleUrl={articleUrl}
      />

      <PublicFooter />
    </div>
  );
}
