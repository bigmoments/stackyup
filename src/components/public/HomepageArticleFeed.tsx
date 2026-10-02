"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { BookOpen, X, Sparkles, ArrowRight } from "lucide-react";
import TopStoriesSection from "./TopStoriesSection";
import EditorialArticleCard from "./EditorialArticleCard";
import EditorialCategorySection from "./EditorialCategorySection";
import MediumSidebar from "./MediumSidebar";
import AdSlot from "./AdSlot";

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

interface HomepageArticleFeedProps {
  initialPosts: PostItem[];
}

export default function HomepageArticleFeed({ initialPosts }: HomepageArticleFeedProps) {
  const [selectedTag, setSelectedTag] = useState<string>("");

  // Sync initial tag from URL on client mount without triggering SSR/Serverless
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tagParam = params.get("tag");
      if (tagParam) {
        setSelectedTag(tagParam);
      }

      // Listen for custom topic select event from navbar
      function handleTopicChange(e: Event) {
        const customEvent = e as CustomEvent<string>;
        setSelectedTag(customEvent.detail || "");
      }

      window.addEventListener("stackyup:tag-change", handleTopicChange);
      return () => window.removeEventListener("stackyup:tag-change", handleTopicChange);
    }
  }, []);

  function handleClearFilter() {
    setSelectedTag("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("tag");
      window.history.pushState({}, "", url.pathname);
      window.dispatchEvent(new CustomEvent("stackyup:tag-change", { detail: "" }));
    }
  }

  // Filter posts in-memory (0ms latency, zero serverless calls)
  const filteredPosts = selectedTag.trim()
    ? initialPosts.filter((p) => {
        const tags = (p.tags as string[]) || [];
        return tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
      })
    : initialPosts;

  // When browsing all articles, slice posts for Top Stories vs Latest Articles
  const topStoriesPosts = initialPosts.slice(0, 4);
  const latestArticlesPosts = initialPosts.length > 4 ? initialPosts.slice(4) : initialPosts;

  return (
    <div className="w-full">
      {/* 1. TOP STORIES SECTION (First Viewport - 1 Main Story + 3 Trending Stacked) */}
      {!selectedTag && <TopStoriesSection posts={topStoriesPosts} />}

      {/* 2. MAIN EDITORIAL CONTENT + SIDEBAR LAYOUT (70-75% Main + 25-30% Sidebar) */}
      <div id="articles" className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start scroll-mt-20">
        {/* Main Column: Latest Articles (3-Column Editorial Grid) */}
        <div className="lg:col-span-8 xl:col-span-8 min-w-0">
          {/* Header for Filtered Tag */}
          {selectedTag ? (
            <div className="mb-8 pb-4 border-b border-[#e8ece9] flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-[#667085] font-semibold font-sans">
                  Topic Filter
                </span>
                <h1 className="font-bold text-2xl sm:text-3xl text-[#101313] tracking-tight font-sans">
                  {selectedTag}
                </h1>
              </div>
              <button
                type="button"
                onClick={handleClearFilter}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e8ece9] text-xs text-[#078a4b] hover:bg-[#f4fbf7] font-semibold transition-colors cursor-pointer"
              >
                <span>Clear filter</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#e8ece9]">
              <h2 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#101313] font-sans flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#078a4b]" />
                <span>Latest Articles</span>
              </h2>
              <a
                href="#all-topics"
                className="text-xs sm:text-sm font-semibold text-[#078a4b] hover:text-[#066a3d] transition-colors flex items-center gap-1 group"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          )}

          {/* Empty State */}
          {filteredPosts.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-[#f4fbf7] rounded-2xl border border-[#e8ece9] p-8">
              <BookOpen className="w-10 h-10 text-[#8a9099] mx-auto mb-2" />
              <p className="font-bold text-xl text-[#101313]">
                No stories found for &ldquo;{selectedTag}&rdquo;
              </p>
              <p className="text-sm text-[#667085] max-w-sm mx-auto">
                Explore our full library of AI reviews, software benchmarks, and productivity teardowns.
              </p>
              <button
                type="button"
                onClick={handleClearFilter}
                className="inline-block px-5 py-2.5 rounded-xl bg-[#078a4b] text-white text-xs font-semibold hover:bg-[#066a3d] transition mt-2 shadow-xs cursor-pointer"
              >
                Back to all stories
              </button>
            </div>
          ) : (
            /* 3-Column Editorial Grid (clean whitespace, no heavy outer card boxes) */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {(selectedTag ? filteredPosts : latestArticlesPosts).map((post, idx) => (
                <Fragment key={post.id}>
                  <EditorialArticleCard post={post} />
                  {/* Seamless Native In-Feed AdSlot after index 1 */}
                  {idx === 1 && !selectedTag && (
                    <AdSlot
                      variant="in-feed"
                      slotId={`in-feed-${idx}`}
                    />
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Editorial Sidebar (25-30% width) */}
        <div className="lg:col-span-4 xl:col-span-4 border-l border-[#e8ece9] pl-8 xl:pl-10 sticky top-20">
          <MediumSidebar staffPicks={initialPosts} />
        </div>
      </div>

      {/* 3. CATEGORY DEEP-DIVES (Curated Topical Sections for Internal Linking & Authority) */}
      {!selectedTag && (
        <div id="all-topics" className="mt-8 space-y-4">
          {/* Section A: AI TOOLS (Split Layout: 1 Main Story on Left + 3 Compact on Right) */}
          <EditorialCategorySection
            title="AI Tools"
            categoryTag="AI Tools"
            posts={initialPosts}
            layout="split"
          />

          {/* Section B: COMPARISONS (3-Column Grid) */}
          <EditorialCategorySection
            title="Comparisons"
            categoryTag="Comparisons"
            posts={initialPosts}
            layout="grid"
          />

          {/* Section C: PRODUCTIVITY (3-Column Grid) */}
          <EditorialCategorySection
            title="Productivity"
            categoryTag="Productivity"
            posts={initialPosts}
            layout="grid"
          />

          {/* Bottom Archive Callout */}
          <div className="pt-12 pb-6 text-center border-t border-[#e8ece9]">
            <Link
              href="/?tag=Tech"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#f8faf9] hover:bg-[#078a4b] text-[#101313] hover:text-white border border-[#e8ece9] text-xs sm:text-sm font-semibold transition-all shadow-2xs group"
            >
              <span>Explore More Stories in Archive</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
