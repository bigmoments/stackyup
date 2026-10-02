"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Check, Star } from "lucide-react";
import AdSlot from "./AdSlot";

export interface RecommendedArticle {
  id: string;
  title: string;
  slug: string;
  featuredImageUrl?: string | null;
  publishedAt?: Date | string | null;
  createdAt?: Date | string;
  tags?: string[] | unknown;
  views?: number;
}

interface ArticleRightSidebarProps {
  recommendedPosts?: RecommendedArticle[];
}

export default function ArticleRightSidebar({
  recommendedPosts = [],
}: ArticleRightSidebarProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail("");
    }, 2500);
  }

  // 4 curated items matching Mockup Image 1
  const defaultRecommended: RecommendedArticle[] = [
    {
      id: "rec_1",
      title: "ChatGPT vs Claude vs Gemini: Which One Should Freelancers Use?",
      slug: "claude-3-7-sonnet-vs-gpt-4-5-definitive-benchmark",
      featuredImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop",
      tags: ["COMPARISONS"],
      publishedAt: "Sep 28, 2026",
      views: 120,
    },
    {
      id: "rec_2",
      title: "How to Automate Repetitive Tasks as a Freelancer",
      slug: "10-ai-prompts-that-saved-freelance-agency-20-hours",
      featuredImageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=300&auto=format&fit=crop",
      tags: ["PRODUCTIVITY"],
      publishedAt: "Sep 15, 2026",
      views: 87,
    },
    {
      id: "rec_3",
      title: "Best AI Tools for Content Creators in 2026",
      slug: "7-best-ai-tools-for-freelancers-in-2026",
      featuredImageUrl: "https://images.unsplash.com/photo-1633493106115-0d045d4750c1?q=80&w=300&auto=format&fit=crop",
      tags: ["AI TOOLS"],
      publishedAt: "Sep 20, 2026",
      views: 156,
    },
    {
      id: "rec_4",
      title: "Notion AI: A Complete Guide for Freelancers",
      slug: "why-small-language-models-are-silently-winning",
      featuredImageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=300&auto=format&fit=crop",
      tags: ["TECH"],
      publishedAt: "Sep 12, 2026",
      views: 94,
    },
  ];

  const displayList =
    recommendedPosts.length >= 4 ? recommendedPosts.slice(0, 4) : defaultRecommended;

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. TOP ADVERTISEMENT (Centrally managed via src/config/ads.ts or Google AdSense) */}
      <AdSlot variant="sidebar" slotId="article-right-sidebar-top" />

      {/* 2. RECOMMENDED FOR YOU (Matching Mockup 1) */}
      <div className="bg-white rounded-2xl border border-[#eaedeb] p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5">
        <div className="flex items-center gap-2">
          <Star className="w-4.5 h-4.5 fill-[#f6b800] text-[#f6b800]" />
          <h4 className="font-bold text-[15px] text-[#101313] tracking-tight">
            Recommended for You
          </h4>
        </div>

        <div className="space-y-3.5">
          {displayList.map((item, idx) => {
            const tags = (item.tags as string[]) || [];
            const tag = tags[0] || (idx === 0 ? "COMPARISONS" : idx === 1 ? "PRODUCTIVITY" : idx === 2 ? "AI TOOLS" : "TECH");
            const dateStr =
              typeof item.publishedAt === "string"
                ? item.publishedAt
                : item.publishedAt
                ? new Date(item.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Sep 20, 2026";
            const viewsCount = item.views || (idx === 0 ? 120 : idx === 1 ? 87 : idx === 2 ? 156 : 94);

            return (
              <article key={item.id} className="flex items-start gap-3 group">
                <Link
                  href={`/${item.slug}`}
                  className="w-[76px] h-[54px] rounded-lg overflow-hidden bg-neutral-900 border border-[#eaedeb] relative block shrink-0"
                >
                  <img
                    src={item.featuredImageUrl || defaultRecommended[idx]?.featuredImageUrl || ""}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#079653] block leading-none mb-1">
                    {tag}
                  </span>
                  <Link href={`/${item.slug}`} className="block">
                    <h5 className="font-bold text-[12.5px] text-[#101313] group-hover:text-[#079653] transition-colors line-clamp-2 leading-[1.3]">
                      {item.title}
                    </h5>
                  </Link>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#9ca3af] mt-1">
                    <span>{dateStr}</span>
                    <span>•</span>
                    <span>{viewsCount} views</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* 3. GET THE LATEST INSIGHTS (Matching Mockup 1) */}
      <div className="bg-[#f4fbf7] rounded-2xl border border-[#d6e8de] p-4.5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#eaf7f0] border border-[#d3ecdd] flex items-center justify-center text-[#079653] shrink-0">
            <Mail className="w-3.5 h-3.5 text-[#079653]" />
          </div>
          <h4 className="font-bold text-[15px] text-[#101313] tracking-tight">
            Get the Latest Insights
          </h4>
        </div>

        <p className="text-[12.5px] text-[#4b5563] leading-relaxed">
          Join 5,000+ freelancers and creators who get weekly reviews, comparisons, and tips.
        </p>

        {subscribed ? (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#eaf7f0] text-xs text-[#079653] font-medium border border-[#079653]/20">
            <Check className="w-4 h-4 shrink-0" />
            <span>You&apos;re subscribed! Welcome aboard.</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 min-w-0 h-[38px] px-3 text-[12.5px] rounded-lg border border-[#d6e8de] bg-white text-[#101313] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#079653] transition"
              />
              <button
                type="submit"
                className="h-[38px] px-4 rounded-lg bg-[#079653] hover:bg-[#057842] text-white text-[12.5px] font-semibold transition cursor-pointer shrink-0"
              >
                Subscribe
              </button>
            </div>
            <p className="text-[11px] text-[#8a9099]">
              No spam. Unsubscribe anytime.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
