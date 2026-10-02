"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  List,
  ChevronUp,
  Bookmark,
  Compass,
  CircleDollarSign,
  CheckSquare,
  Wrench,
  FileText,
} from "lucide-react";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface RelatedItem {
  id: string;
  title: string;
  slug: string;
  featuredImageUrl?: string | null;
  tags?: string[] | unknown;
  publishedAt?: Date | string | null;
  createdAt?: Date | string;
}

interface ArticleLeftNavProps {
  headings: TocItem[];
  relatedPosts?: RelatedItem[];
}

export default function ArticleLeftNav({
  headings = [],
  relatedPosts = [],
}: ArticleLeftNavProps) {
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(true);

  // Smooth ScrollSpy tracking active heading
  useEffect(() => {
    if (headings.length === 0) return;

    function handleScroll() {
      const scrollY = window.scrollY;
      const targetThreshold = scrollY + 100;
      for (let i = headings.length - 1; i >= 0; i--) {
        const el = document.getElementById(headings[i].id);
        if (el && el.offsetTop <= targetThreshold) {
          setActiveHeadingId(headings[i].id);
          return;
        }
      }
      if (headings[0]) {
        setActiveHeadingId(headings[0].id);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  // 3 fallback items matching Mockup Image 1
  const defaultRelated: RelatedItem[] = [
    {
      id: "rel_1",
      title: "ChatGPT vs Claude vs Gemini: Which One Should Freelancers Use?",
      slug: "claude-3-7-sonnet-vs-gpt-4-5-definitive-benchmark",
      featuredImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop",
      tags: ["COMPARISONS"],
      publishedAt: "Sep 28, 2026",
    },
    {
      id: "rel_2",
      title: "10 Productivity Tools to Supercharge Your Freelance Agency",
      slug: "10-ai-prompts-that-saved-freelance-agency-20-hours",
      featuredImageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=300&auto=format&fit=crop",
      tags: ["PRODUCTIVITY"],
      publishedAt: "Sep 25, 2026",
    },
    {
      id: "rel_3",
      title: "Best AI Tools for Content Creators in 2026",
      slug: "7-best-ai-tools-for-freelancers-in-2026",
      featuredImageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=300&auto=format&fit=crop",
      tags: ["AI TOOLS"],
      publishedAt: "Sep 20, 2026",
    },
  ];

  const displayRelated = relatedPosts.length >= 3 ? relatedPosts.slice(0, 3) : defaultRelated;

  return (
    <nav
      aria-label="Article Table of Contents and Navigation"
      className="space-y-4 font-sans select-none"
    >
      {/* 1. CARD 1: TABLE OF CONTENTS + ON THIS PAGE */}
      <div className="bg-white rounded-2xl border border-[#eaedeb] p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5">
        {/* Table of Contents Header */}
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-2">
            <List className="w-4.5 h-4.5 text-[#079653]" />
            <h3 className="font-bold text-[15px] text-[#101313] tracking-tight">
              Table of Contents
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-[#8a9099] hover:text-[#101313] transition cursor-pointer"
            aria-label="Toggle Table of Contents"
          >
            <ChevronUp
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "" : "rotate-180"
              }`}
            />
          </button>
        </div>

        {/* Table of Contents List */}
        {isOpen && headings.length > 0 && (
          <ol className="space-y-1 list-none pl-0 pt-0.5">
            {headings.map((item, idx) => {
              const isActive =
                activeHeadingId === item.id || (!activeHeadingId && idx === 0);
              // Strip existing leading number from heading (e.g. "1. ChatGPT" -> "ChatGPT") to avoid double numbers
              const cleanText = item.text.replace(/^\d+[\.\)]\s*/, "");

              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const targetEl = document.getElementById(item.id);
                      if (targetEl) {
                        const navOffset = 88;
                        const elementPosition = targetEl.getBoundingClientRect().top + window.scrollY;
                        window.scrollTo({
                          top: elementPosition - navOffset,
                          behavior: "smooth",
                        });
                        setActiveHeadingId(item.id);
                        window.history.pushState(null, "", `#${item.id}`);
                      }
                    }}
                    className={`flex items-start gap-2.5 py-1.5 px-2 rounded-lg transition-all leading-snug text-[13px] ${
                      isActive
                        ? "bg-[#f4fbf7] text-[#079653] font-semibold"
                        : "text-[#4b5563] hover:text-[#101313] hover:bg-[#f8faf9]"
                    }`}
                  >
                    <span
                      className={`w-5 shrink-0 text-left tabular-nums text-[12px] pt-[1px] ${
                        isActive
                          ? "text-[#079653] font-bold"
                          : "text-[#9ca3af] font-medium"
                      }`}
                    >
                      {idx + 1}.
                    </span>
                    <span className="flex-1 min-w-0">{cleanText}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        )}

        {/* Divider */}
        <div className="h-px bg-[#eaedeb] my-3" />

        {/* 2. ON THIS PAGE / QUICK JUMP */}
        <div className="space-y-2">
          <h4 className="font-bold text-[13.5px] text-[#101313] pb-0.5">
            On This Page
          </h4>

          <div className="space-y-0.5">
            <a
              href="#ai-key-takeaways"
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-[#4b5563] hover:text-[#079653] hover:bg-[#f4fbf7] transition-colors"
            >
              <Bookmark className="w-4 h-4 text-[#9ca3af] shrink-0" />
              <span className="text-[13px]">Key Takeaways</span>
            </a>

            <a
              href="#chatgpt-the-all-round-assistant"
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-[#4b5563] hover:text-[#079653] hover:bg-[#f4fbf7] transition-colors"
            >
              <Compass className="w-4 h-4 text-[#9ca3af] shrink-0" />
              <span className="text-[13px]">Best Use Cases</span>
            </a>

            <a
              href="#pricing-value-matrix"
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-[#4b5563] hover:text-[#079653] hover:bg-[#f4fbf7] transition-colors"
            >
              <CircleDollarSign className="w-4 h-4 text-[#9ca3af] shrink-0" />
              <span className="text-[13px]">Pricing</span>
            </a>

            <a
              href="#final-verdict-where-to-start"
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-[#4b5563] hover:text-[#079653] hover:bg-[#f4fbf7] transition-colors"
            >
              <CheckSquare className="w-4 h-4 text-[#9ca3af] shrink-0" />
              <span className="text-[13px]">Pros &amp; Cons</span>
            </a>

            <a
              href="#perplexity-research-without-hallucinations"
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-[#4b5563] hover:text-[#079653] hover:bg-[#f4fbf7] transition-colors"
            >
              <Wrench className="w-4 h-4 text-[#9ca3af] shrink-0" />
              <span className="text-[13px]">Alternatives</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. CARD 2: RELATED ARTICLES */}
      <div className="bg-white rounded-2xl border border-[#eaedeb] p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#079653]" />
            <h3 className="font-bold text-[15px] text-[#101313] tracking-tight">
              Related Articles
            </h3>
          </div>
          <Link
            href="/?category=all"
            className="text-[12px] font-semibold text-[#079653] hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="space-y-3.5">
          {displayRelated.map((item, idx) => {
            const tags = (item.tags as string[]) || [];
            const tag = tags[0] || (idx === 0 ? "COMPARISONS" : idx === 1 ? "PRODUCTIVITY" : "AI TOOLS");
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

            return (
              <article key={item.id} className="flex items-start gap-3 group">
                <Link
                  href={`/${item.slug}`}
                  className="w-[76px] h-[54px] rounded-lg overflow-hidden bg-neutral-900 border border-[#eaedeb] relative block shrink-0"
                >
                  <img
                    src={item.featuredImageUrl || defaultRelated[idx]?.featuredImageUrl || ""}
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
                    <h4 className="font-bold text-[12.5px] text-[#101313] group-hover:text-[#079653] transition-colors line-clamp-2 leading-[1.3]">
                      {item.title}
                    </h4>
                  </Link>
                  <span className="text-[11px] text-[#9ca3af] mt-1 block">
                    {dateStr}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
