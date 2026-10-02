"use client";

import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";
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

interface EditorialArticleCardProps {
  post: PostItem;
  showExcerpt?: boolean;
}

export default function EditorialArticleCard({
  post,
  showExcerpt = true,
}: EditorialArticleCardProps) {
  const tagsList = (post.tags as string[]) || [];
  const primaryTag = tagsList[0] || "AI Tools";

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

  return (
    <article className="group flex flex-col justify-between">
      <div>
        {/* 16:9 Aspect Ratio Editorial Image */}
        <Link
          href={`/${post.slug}`}
          className="block relative aspect-video overflow-hidden rounded-xl bg-neutral-100 border border-[#e8ece9] mb-3"
        >
          {post.featuredImageUrl ? (
            <img
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt || post.title}
              className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f4fbf7] to-[#eaf8f0] text-[#078a4b]">
              <Sparkles className="w-8 h-8 opacity-30" />
            </div>
          )}
        </Link>

        {/* Category Tag */}
        <div className="mb-1.5">
          <Link
            href={`/?tag=${encodeURIComponent(primaryTag)}`}
            className="text-[11px] font-bold uppercase tracking-wider text-[#078a4b] hover:text-[#066a3d] transition-colors"
          >
            {primaryTag}
          </Link>
        </div>

        {/* Title */}
        <Link href={`/${post.slug}`} className="block">
          <h3 className="text-base sm:text-[17px] font-bold text-[#101313] leading-snug tracking-tight group-hover:text-[#078a4b] transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        {showExcerpt && (
          <p className="text-xs sm:text-sm text-[#667085] leading-relaxed mt-2 line-clamp-2">
            {excerptText}
          </p>
        )}
      </div>

      {/* Date & Meta Info */}
      <div className="flex items-center gap-2 text-xs text-[#8a9099] mt-3 pt-2">
        <time dateTime={dateObj.toISOString()}>{formattedDate}</time>
        <span>&bull;</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#8a9099]" />
          {readingTime}m read
        </span>
      </div>
    </article>
  );
}
