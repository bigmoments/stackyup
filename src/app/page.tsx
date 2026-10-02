import { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";
import HomepageArticleFeed from "@/components/public/HomepageArticleFeed";

// 100% Free Tier Optimization: Pure On-Demand SSG.
// Revalidates ONLY on CMS publish/update/delete events via revalidatePath("/")
export const revalidate = false;

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stackyup.com";

export const metadata: Metadata = {
  title: "StackYup — Best AI Tools, Honest Reviews & Comparisons (2026)",
  description:
    "Discover the best AI tools for freelancers, developers, and creators. Real-world benchmarks, pricing comparisons, and practical production guides.",
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "StackYup — AI Tools & Software Benchmarks",
    description:
      "In-depth benchmarks, honest comparisons, and reviews of top artificial intelligence software and SaaS tools in 2026.",
    url: baseUrl,
    siteName: "StackYup",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "StackYup — AI Tools & Software Benchmarks",
    description:
      "In-depth benchmarks, honest comparisons, and reviews of top artificial intelligence software and SaaS tools in 2026.",
    creator: "@stackyup",
  },
};

export default async function HomePage() {
  // Pre-render published posts into static HTML during build
  const posts = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.status, "published"))
    .orderBy(desc(schema.posts.publishedAt))
    .limit(50);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "StackYup",
    url: baseUrl,
    description:
      "In-depth benchmarks, honest comparisons, and reviews of top artificial intelligence software and SaaS tools in 2026.",
    publisher: {
      "@type": "Organization",
      name: "StackYup",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/favicon.ico`,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/?tag={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StackYup",
    url: baseUrl,
    logo: `${baseUrl}/favicon.ico`,
    founder: {
      "@type": "Person",
      name: "Adit",
      jobTitle: "Founder & Tech Researcher",
    },
    sameAs: [
      "https://twitter.com/stackyup",
      "https://github.com/stackyup",
    ],
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-[#101313]">
      {/* Schema.org WebSite Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      {/* Schema.org Organization Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* Global Unified Header with inline topics and search */}
      <PublicNavbar />

      {/* Main Container with Client-Side Instant Filtering */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-6 pb-20">
        <HomepageArticleFeed initialPosts={posts} />
      </main>

      <PublicFooter />
    </div>
  );
}
