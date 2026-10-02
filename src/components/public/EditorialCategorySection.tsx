"use client";

import Link from "next/link";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { calculateReadingTime } from "@/lib/reading-time";
import EditorialArticleCard from "./EditorialArticleCard";

interface PostItem {
  id: string;
  title: string;
  slug: string;
  contentHtml?: string;
  excerpt?: string | null;
  metaDescription?: string | null;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  tags?: string[] | unknown;
  claps?: number;
  authorName?: string | null;
  publishedAt?: Date | null;
  createdAt: Date;
}

interface EditorialCategorySectionProps {
  title: string;
  categoryTag: string;
  posts: PostItem[];
  layout?: "split" | "grid";
}

export default function EditorialCategorySection({
  title,
  categoryTag,
  posts,
  layout = "grid",
}: EditorialCategorySectionProps) {
  if (!posts || posts.length === 0) return null;

  // Filter posts matching this category tag (case-insensitive)
  const categoryPosts = posts.filter((p) => {
    const tags = (p.tags as string[]) || [];
    return tags.some((t) => t.toLowerCase() === categoryTag.toLowerCase());
  });

  // If fewer than 2 posts match specific category, fallback to first few posts so the section stays populated
  const displayPosts = categoryPosts.length >= 2 ? categoryPosts : posts.slice(0, 4);
  if (displayPosts.length === 0) return null;

  const mainPost = displayPosts[0];
  const sidePosts = displayPosts.slice(1, 4);

  function formatDate(dateVal?: Date | string | null): string {
    const dateObj = new Date(dateVal || Date.now());
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <section className="my-14 sm:my-16 pt-8 border-t border-[#e8ece9]">
      {/* Header with Title and "View all →" */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e8ece9]">
        <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-[#101313] font-sans flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#078a4b]" />
          <span>{title}</span>
        </h2>
        <Link
          href={`/?tag=${encodeURIComponent(categoryTag)}`}
          className="text-xs sm:text-sm font-semibold text-[#078a4b] hover:text-[#066a3d] transition-colors flex items-center gap-1 group"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {layout === "split" ? (
        /* Split Layout: 1 Main Story on Left + 3 Stacked Stories on Right */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Category Article (7 cols) */}
          <div className="lg:col-span-7">
            <article className="group">
              <Link
                href={`/${mainPost.slug}`}
                className="block relative aspect-video overflow-hidden rounded-xl bg-neutral-100 border border-[#e8ece9] mb-3"
              >
                {mainPost.featuredImageUrl ? (
                  <img
                    src={mainPost.featuredImageUrl}
                    alt={mainPost.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f4fbf7] to-[#eaf8f0] text-[#078a4b]">
                    <Sparkles className="w-10 h-10 opacity-30" />
                  </div>
                )}
              </Link>

              <Link href={`/${mainPost.slug}`} className="block">
                <h3 className="text-xl sm:text-2xl font-bold text-[#101313] leading-snug tracking-tight group-hover:text-[#078a4b] transition-colors">
                  {mainPost.title}
                </h3>
              </Link>

              {(mainPost.excerpt || mainPost.metaDescription) && (
                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed mt-2 line-clamp-3">
                  {mainPost.excerpt || mainPost.metaDescription}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-[#8a9099] mt-3">
                <time dateTime={new Date(mainPost.publishedAt || mainPost.createdAt).toISOString()}>
                  {formatDate(mainPost.publishedAt || mainPost.createdAt)}
                </time>
                <span>&bull;</span>
                <span>{calculateReadingTime(mainPost.contentHtml || mainPost.excerpt || mainPost.title)}m read</span>
              </div>
            </article>
          </div>

          {/* 3 Compact Articles Stacked on Right (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between divide-y divide-[#e8ece9]">
            {sidePosts.map((post) => {
              const readingTime = calculateReadingTime(post.contentHtml || post.excerpt || post.title);

              return (
                <article key={post.id} className="py-4 first:pt-0 last:pb-0 group flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <Link href={`/${post.slug}`} className="block">
                      <h4 className="text-sm sm:text-base font-bold text-[#101313] leading-snug tracking-tight group-hover:text-[#078a4b] transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-[#8a9099] mt-2">
                      <time dateTime={new Date(post.publishedAt || post.createdAt).toISOString()}>
                        {formatDate(post.publishedAt || post.createdAt)}
                      </time>
                      <span>&bull;</span>
                      <span>{readingTime}m read</span>
                    </div>
                  </div>

                  {post.featuredImageUrl && (
                    <Link
                      href={`/${post.slug}`}
                      className="w-20 h-14 sm:w-24 sm:h-16 shrink-0 rounded-lg overflow-hidden bg-neutral-100 border border-[#e8ece9] relative block"
                    >
                      <img
                        src={post.featuredImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3-Column Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {displayPosts.slice(0, 3).map((post) => (
            <EditorialArticleCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
