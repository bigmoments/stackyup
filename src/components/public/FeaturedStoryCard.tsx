"use client";

import Link from "next/link";
import { Sparkles, Clock, ArrowRight, Eye } from "lucide-react";
import MediumBookmarkButton from "./MediumBookmarkButton";
import MediumClapButton from "./MediumClapButton";
import { calculateReadingTime } from "@/lib/reading-time";

interface FeaturedStoryCardProps {
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
}

export default function FeaturedStoryCard({ post }: FeaturedStoryCardProps) {
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
    "In-depth analysis, benchmark comparisons, and practical takeaways to help you select and master the best tools.";

  return (
    <div className="bg-white rounded-2xl border border-[#E8ECE9] overflow-hidden hover:border-[#078a4b]/40 hover:shadow-md transition-all duration-300 group">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
        {/* Left Column: 16:9 Image (38-40% width) */}
        <div className="lg:col-span-5 relative overflow-hidden bg-neutral-100 min-h-[220px] sm:min-h-[260px] lg:min-h-full">
          <Link href={`/${post.slug}`} className="block w-full h-full">
            {post.featuredImageUrl ? (
              <img
                src={post.featuredImageUrl}
                alt={post.featuredImageAlt || post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F4FBF7] to-[#EAF8F0] text-[#078a4b]">
                <Sparkles className="w-12 h-12 opacity-40" />
              </div>
            )}
          </Link>
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-[#078a4b] shadow-xs border border-[#E8ECE9]">
              <Sparkles className="w-3.5 h-3.5 fill-[#078a4b]" />
              Featured Story
            </span>
          </div>
        </div>

        {/* Right Column: Story Details (60-62% width) */}
        <div className="lg:col-span-7 p-5 sm:p-7 lg:p-8 flex flex-col justify-between">
          <div>
            {/* Byline */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#667085] mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#101313] text-white flex items-center justify-center text-[10px] font-bold">
                  {authorInitial}
                </div>
                <span className="font-medium text-[#101313]">{authorName}</span>
              </div>
              <span className="text-[#8A9099]">•</span>
              <time dateTime={dateObj.toISOString()}>{formattedDate}</time>
              <span className="text-[#8A9099]">•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#8A9099]" />
                {readingTime} min read
              </span>
            </div>

            {/* Title */}
            <Link href={`/${post.slug}`} className="block group/title">
              <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-[#101313] leading-snug tracking-tight group-hover/title:text-[#078a4b] transition-colors">
                {post.title}
              </h2>
            </Link>

            {/* Excerpt */}
            <p className="text-sm sm:text-base text-[#667085] leading-relaxed mt-2.5 line-clamp-3">
              {excerptText}
            </p>

            {/* Tags Pills */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4">
              {tagsList.slice(0, 3).map((tag) => (
                <Link
                  key={tag}
                  href={`/?tag=${encodeURIComponent(tag)}`}
                  className="px-2.5 py-1 rounded-md bg-[#F4FBF7] text-[#078a4b] border border-[#E8ECE9] text-xs font-medium hover:bg-[#078a4b] hover:text-white transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-5 mt-5 border-t border-[#E8ECE9]">
            <div className="flex items-center gap-2 sm:gap-3">
              <MediumClapButton
                postId={post.id}
                initialClaps={post.claps || 0}
                size="sm"
              />
              <MediumBookmarkButton slug={post.slug} size="sm" />
              <span className="text-xs text-[#8A9099] inline-flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {(post.claps || 0) * 8 + 45} views
              </span>
            </div>

            <Link
              href={`/${post.slug}`}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#078a4b] hover:text-[#066a3d] group-hover:translate-x-0.5 transition-all py-1"
            >
              <span>Read story</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
