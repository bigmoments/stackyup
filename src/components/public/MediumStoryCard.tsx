"use client";

import Link from "next/link";
import { Sparkles, Clock, ArrowRight, Eye } from "lucide-react";
import MediumBookmarkButton from "./MediumBookmarkButton";
import MediumClapButton from "./MediumClapButton";
import { calculateReadingTime } from "@/lib/reading-time";

interface MediumStoryCardProps {
  post: {
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
    authorName?: string;
    publishedAt?: Date | null;
    createdAt: Date;
  };
  featured?: boolean;
}

export default function MediumStoryCard({ post }: MediumStoryCardProps) {
  const tagsList = (post.tags as string[]) || [];
  const primaryTag = tagsList[0] || "AI & Tech";

  const authorName = post.authorName || "Adit";
  const authorInitial = authorName.charAt(0).toUpperCase();

  const dateObj = new Date(post.publishedAt || post.createdAt);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const readingTime = calculateReadingTime(post.contentHtml || post.excerpt || post.title);

  const excerptText =
    post.excerpt ||
    post.metaDescription ||
    "In-depth analysis, benchmark comparisons, and practical takeaways to help you work smarter.";

  const viewCount = (post.claps || 0) * 7 + 38;

  return (
    <article className="bg-white rounded-xl border border-[#E8ECE9] overflow-hidden hover:border-[#078a4b]/40 hover:shadow-sm transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* 1. 16:9 Image */}
        <Link href={`/${post.slug}`} className="block relative aspect-video overflow-hidden bg-neutral-100">
          {post.featuredImageUrl ? (
            <img
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt || post.title}
              className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F4FBF7] to-[#EAF8F0] text-[#078a4b]">
              <Sparkles className="w-8 h-8 opacity-40" />
            </div>
          )}
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/95 text-[#078a4b] shadow-2xs border border-[#E8ECE9]">
              {primaryTag}
            </span>
          </div>
        </Link>

        {/* 2. Card Content */}
        <div className="p-4 sm:p-5">
          {/* Byline */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#667085] mb-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[#101313] text-white flex items-center justify-center text-[9px] font-bold">
                {authorInitial}
              </div>
              <span className="font-medium text-[#101313]">{authorName}</span>
            </div>
            <span className="text-[#8A9099]">•</span>
            <time dateTime={dateObj.toISOString()}>{formattedDate}</time>
            <span className="text-[#8A9099]">•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#8A9099]" />
              {readingTime}m
            </span>
          </div>

          {/* Title */}
          <Link href={`/${post.slug}`} className="block">
            <h3 className="text-base sm:text-lg font-bold text-[#101313] leading-snug tracking-tight group-hover:text-[#078a4b] transition-colors line-clamp-2">
              {post.title}
            </h3>
          </Link>

          {/* Excerpt */}
          <p className="text-xs sm:text-sm text-[#667085] leading-relaxed mt-2 line-clamp-2">
            {excerptText}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3.5">
            {tagsList.slice(0, 2).map((tag) => (
              <Link
                key={tag}
                href={`/?tag=${encodeURIComponent(tag)}`}
                className="px-2 py-0.5 rounded text-[11px] bg-[#F4FBF7] text-[#078a4b] hover:bg-[#078a4b] hover:text-white transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Footer Actions */}
      <div className="px-4 sm:px-5 pb-3.5 pt-3 border-t border-[#E8ECE9] flex items-center justify-between text-xs text-[#667085]">
        <div className="flex items-center gap-2">
          <MediumClapButton
            size="sm"
            postId={post.id}
            initialClaps={post.claps || 0}
          />
          <MediumBookmarkButton slug={post.slug} size="sm" />
          <span className="text-[11px] text-[#8A9099] inline-flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {viewCount}
          </span>
        </div>

        <Link
          href={`/${post.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#078a4b] hover:text-[#066a3d] group-hover:translate-x-0.5 transition-all py-1"
        >
          <span>Read</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
