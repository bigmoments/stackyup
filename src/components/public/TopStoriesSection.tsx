"use client";

import Link from "next/link";
import { Clock, Eye, Sparkles } from "lucide-react";
import { calculateReadingTime } from "@/lib/reading-time";

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

interface TopStoriesSectionProps {
  posts: PostItem[];
}

export default function TopStoriesSection({ posts }: TopStoriesSectionProps) {
  if (!posts || posts.length === 0) return null;

  const mainPost = posts[0];
  const trendingPosts = posts.slice(1, 4);

  // Helper for tag extraction
  function getPrimaryTag(post: PostItem): string {
    const tags = (post.tags as string[]) || [];
    return tags[0] || "AI Tools";
  }

  // Format date helper
  function formatDate(dateVal?: Date | string | null): string {
    const dateObj = new Date(dateVal || Date.now());
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const mainTag = getPrimaryTag(mainPost);
  const mainReadingTime = calculateReadingTime(mainPost.contentHtml || mainPost.excerpt || mainPost.title);
  const mainAuthor = mainPost.authorName || "Adit";
  const mainExcerpt =
    mainPost.excerpt ||
    mainPost.metaDescription ||
    "An in-depth breakdown of the essential AI tools and workflows for modern creators, developers, and independent operators.";

  return (
    <section className="mb-14 sm:mb-16">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[#e8ece9] pb-3 mb-6">
        <h2 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#101313] font-sans flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#078a4b]" />
          <span>Top Stories</span>
        </h2>
        <span className="text-xs text-[#8a9099] font-medium hidden sm:inline-block">
          Curated Editorial Selection
        </span>
      </div>

      {/* 2-Column Split: Main Story (Left) + Trending List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
        {/* Left: Main Big Story (60-65% width) */}
        <div className="lg:col-span-7 xl:col-span-7">
          <article className="group">
            {/* 16:9 Image */}
            <Link
              href={`/${mainPost.slug}`}
              className="block relative aspect-video overflow-hidden rounded-xl bg-neutral-100 border border-[#e8ece9] mb-4"
            >
              {mainPost.featuredImageUrl ? (
                <img
                  src={mainPost.featuredImageUrl}
                  alt={mainPost.featuredImageAlt || mainPost.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f4fbf7] to-[#eaf8f0] text-[#078a4b]">
                  <Sparkles className="w-12 h-12 opacity-30" />
                </div>
              )}
            </Link>

            {/* Category Tag */}
            <div className="mb-2">
              <Link
                href={`/?tag=${encodeURIComponent(mainTag)}`}
                className="text-xs font-bold uppercase tracking-wider text-[#078a4b] hover:text-[#066a3d] transition-colors"
              >
                {mainTag}
              </Link>
            </div>

            {/* Headline */}
            <Link href={`/${mainPost.slug}`} className="block">
              <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#101313] leading-tight tracking-tight group-hover:text-[#078a4b] transition-colors">
                {mainPost.title}
              </h3>
            </Link>

            {/* Excerpt */}
            <p className="text-sm sm:text-base text-[#667085] leading-relaxed mt-2.5 line-clamp-3">
              {mainExcerpt}
            </p>

            {/* Byline */}
            <div className="flex items-center gap-2 text-xs text-[#8a9099] mt-3 pt-3 border-t border-[#f0f3f1]">
              <span className="font-semibold text-[#101313]">{mainAuthor}</span>
              <span>&bull;</span>
              <time dateTime={new Date(mainPost.publishedAt || mainPost.createdAt).toISOString()}>
                {formatDate(mainPost.publishedAt || mainPost.createdAt)}
              </time>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#8a9099]" />
                {mainReadingTime} min read
              </span>
            </div>
          </article>
        </div>

        {/* Right: 3 Trending Stories Stacked (35-40% width) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between h-full divide-y divide-[#e8ece9]">
          {trendingPosts.map((post, idx) => {
            const tag = getPrimaryTag(post);
            const rankNumber = String(idx + 2).padStart(2, "0");
            const readingTime = calculateReadingTime(post.contentHtml || post.excerpt || post.title);

            return (
              <article
                key={post.id}
                className="py-5 first:pt-0 last:pb-0 group flex items-start gap-4"
              >
                {/* Numbered Rank Accent (02, 03, 04) */}
                <span className="font-sans font-bold text-2xl sm:text-3xl text-[#d5dbd7] group-hover:text-[#078a4b] transition-colors w-9 shrink-0 leading-none pt-0.5">
                  {rankNumber}
                </span>

                <div className="min-w-0 flex-1">
                  {/* Category */}
                  <Link
                    href={`/?tag=${encodeURIComponent(tag)}`}
                    className="text-[11px] font-bold uppercase tracking-wider text-[#078a4b] hover:text-[#066a3d] transition-colors block mb-1"
                  >
                    {tag}
                  </Link>

                  {/* Headline */}
                  <Link href={`/${post.slug}`} className="block">
                    <h4 className="text-base sm:text-[17px] font-bold text-[#101313] leading-snug tracking-tight group-hover:text-[#078a4b] transition-colors line-clamp-2">
                      {post.title}
                    </h4>
                  </Link>

                  {/* Excerpt preview if available */}
                  {(post.excerpt || post.metaDescription) && (
                    <p className="text-xs text-[#667085] leading-relaxed line-clamp-2 mt-1">
                      {post.excerpt || post.metaDescription}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-2 text-[11px] text-[#8a9099] mt-2">
                    <time dateTime={new Date(post.publishedAt || post.createdAt).toISOString()}>
                      {formatDate(post.publishedAt || post.createdAt)}
                    </time>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#8a9099]" />
                      {readingTime}m
                    </span>
                  </div>
                </div>

                {/* Optional Mini Thumbnail */}
                {post.featuredImageUrl && (
                  <Link
                    href={`/${post.slug}`}
                    className="w-20 h-16 sm:w-24 sm:h-18 shrink-0 rounded-lg overflow-hidden bg-neutral-100 border border-[#e8ece9] relative block"
                  >
                    <img
                      src={post.featuredImageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
