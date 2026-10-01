import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Sparkles, Calendar, ArrowRight, Tag, Clock } from "lucide-react";
import { db, schema } from "@/db";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { tag } = await searchParams;

  let posts = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.status, "published"))
    .orderBy(desc(schema.posts.publishedAt))
    .limit(20);

  if (tag && tag.trim()) {
    posts = posts.filter((p) => {
      const pTags = (p.tags as string[]) || [];
      return pTags.some((t) => t.toLowerCase() === tag.toLowerCase());
    });
  }

  const featuredPost = posts[0];
  const regularPosts = posts.slice(1);

  const categories = ["All", "AI Tools", "Comparisons", "Freelancers", "Reviews"];

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full space-y-14">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2026 AI Reviews &amp; SaaS Benchmarks</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Discover the Best <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-indigo-300 bg-clip-text text-transparent">AI Tools &amp; Software</span> for High-Growth Workflows
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Unbiased reviews, real-world benchmarks, and pricing teardowns to help you work 10x faster with modern AI.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
            {categories.map((cat) => {
              const isSelected = (!tag && cat === "All") || tag === cat;
              return (
                <Link
                  key={cat}
                  href={cat === "All" ? "/" : `/?tag=${encodeURIComponent(cat)}`}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Post Card */}
        {featuredPost && (
          <section className="rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-2xl relative group">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                    Featured Review
                  </span>
                  {(featuredPost.tags as string[])?.[0] && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
                      {(featuredPost.tags as string[])[0]}
                    </span>
                  )}
                  <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    {new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition leading-snug">
                  <Link href={`/${featuredPost.slug}`}>{featuredPost.title}</Link>
                </h2>

                <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                  {featuredPost.excerpt || featuredPost.metaDescription || "Click to read full in-depth review and benchmark analysis."}
                </p>

                <div className="pt-2">
                  <Link
                    href={`/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-lg shadow-indigo-600/30"
                  >
                    <span>Read Full Article</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5">
                <Link href={`/${featuredPost.slug}`} className="block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 relative aspect-video">
                  {featuredPost.featuredImageUrl ? (
                    <img
                      src={featuredPost.featuredImageUrl}
                      alt={featuredPost.featuredImageAlt || featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                      <Sparkles className="w-12 h-12" />
                    </div>
                  )}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Responsive Non-intrusive AdSense Slot */}
        <section className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-600 text-xs py-6 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Advertisement</span>
          <div className="w-full max-w-2xl h-24 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 flex items-center justify-center">
            <span className="text-slate-500 text-xs">Responsive AdSense Slot (Ready for Google Approval)</span>
          </div>
        </section>

        {/* Regular Posts Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white tracking-tight">
              {tag ? `Articles tagged "${tag}"` : "Latest Comparisons & Guides"}
            </h3>
            <span className="text-xs text-slate-500">{posts.length} articles</span>
          </div>

          {posts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-sm">
              No articles published yet. Publish your first review via the API or Admin Dashboard!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition group shadow-lg"
                >
                  <Link href={`/${post.slug}`} className="block aspect-video overflow-hidden bg-slate-950 relative border-b border-slate-800">
                    {post.featuredImageUrl ? (
                      <img
                        src={post.featuredImageUrl}
                        alt={post.featuredImageAlt || post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <Sparkles className="w-8 h-8" />
                      </div>
                    )}
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                        {(post.tags as string[])?.[0] && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-400 font-semibold">{(post.tags as string[])[0]}</span>
                          </>
                        )}
                      </div>

                      <h4 className="font-bold text-white text-base group-hover:text-indigo-400 transition line-clamp-2 leading-snug">
                        <Link href={`/${post.slug}`}>{post.title}</Link>
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {post.excerpt || post.metaDescription || "Read full review and breakdown..."}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                      <span className="text-slate-500 font-medium">5 min read</span>
                      <Link
                        href={`/${post.slug}`}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
                      >
                        <span>Read</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
