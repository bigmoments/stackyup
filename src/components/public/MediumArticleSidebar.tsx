"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  List,
  Mail,
  FileText,
  UserPlus,
  UserCheck,
  Check,
  Eye,
} from "lucide-react";
import { TocItem } from "@/lib/toc";
import AdSlot from "./AdSlot";

export interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  featuredImageUrl?: string | null;
  publishedAt?: Date | string | null;
  readingTime?: number;
  claps?: number;
}

interface MediumArticleSidebarProps {
  authorName?: string;
  headings: TocItem[];
  relatedPosts?: RelatedArticle[];
}

export default function MediumArticleSidebar({
  authorName = "Adit",
  headings = [],
  relatedPosts = [],
}: MediumArticleSidebarProps) {
  const [following, setFollowing] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");

  // Track active section on scroll
  useEffect(() => {
    if (headings.length === 0) return;

    function handleScroll() {
      const scrollY = window.scrollY;
      for (let i = headings.length - 1; i >= 0; i--) {
        const el = document.getElementById(headings[i].id);
        if (el && el.offsetTop - 120 <= scrollY) {
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

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setTimeout(() => setEmail(""), 2000);
  }

  return (
    <aside className="space-y-6">
      {/* 1. About the Author Card (Screenshot 2) */}
      <div className="p-5 rounded-2xl bg-white border border-[#e8ece9] shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#101313]">
          <User className="w-4 h-4 text-[#078a4b]" />
          <span>About the Author</span>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#101313] text-white flex items-center justify-center text-lg font-bold shrink-0">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#101313] leading-tight">
              {authorName}
            </h4>
            <p className="text-xs text-[#667085] pt-0.5">
              Founder &amp; Tech Researcher
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-[#667085]">
          Independent researcher investigating generative AI, LLM benchmarks, and modern developer workflows.
        </p>

        <button
          type="button"
          onClick={() => setFollowing(!following)}
          className={`w-full py-2 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
            following
              ? "bg-[#078a4b] text-white"
              : "border border-[#e8ece9] text-[#101313] hover:bg-[#f8faf9] hover:border-[#d5dbd7]"
          }`}
        >
          {following ? (
            <>
              <UserCheck className="w-3.5 h-3.5" />
              <span>Following</span>
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5 text-[#078a4b]" />
              <span>+ Follow</span>
            </>
          )}
        </button>

        {/* Social Icons */}
        <div className="flex items-center justify-center gap-4 pt-1 text-[#667085]">
          {/* X / Twitter */}
          <a
            href="https://twitter.com/stackyup"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:text-[#101313] transition"
            title="X (Twitter)"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* LinkedIn */}
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:text-[#101313] transition"
            title="LinkedIn"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.8v8.37h-2.8V10.9M7.86 6.81a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9z" />
            </svg>
          </a>

          {/* GitHub */}
          <a
            href="https://github.com/stackyup"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:text-[#101313] transition"
            title="GitHub"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>

          {/* Mail */}
          <a
            href="mailto:contact@stackyup.com"
            className="p-1.5 hover:text-[#101313] transition"
            title="Email"
          >
            <Mail className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 2. Table of Contents Card (Screenshot 2) */}
      {headings.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-[#e8ece9] shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#101313]">
            <List className="w-4 h-4 text-[#078a4b]" />
            <span>Table of Contents</span>
          </div>

          <nav className="space-y-2 text-xs">
            {headings.map((item, idx) => {
              const isActive = activeHeadingId === item.id || (!activeHeadingId && idx === 0);
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`block py-1 transition-colors leading-relaxed line-clamp-1 ${
                    isActive
                      ? "text-[#078a4b] font-semibold"
                      : "text-[#667085] hover:text-[#101313]"
                  } ${item.level === 3 ? "pl-3 text-[11px]" : ""}`}
                >
                  <span>{idx + 1}. </span>
                  <span>{item.text}</span>
                </a>
              );
            })}
          </nav>
        </div>
      )}

      {/* 3. Get More Insights Card (Newsletter - Screenshot 2) */}
      <div className="p-5 rounded-2xl bg-white border border-[#e8ece9] shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#101313]">
          <Mail className="w-4 h-4 text-[#078a4b]" />
          <span>Get More Insights</span>
        </div>

        <p className="text-xs text-[#667085] leading-relaxed">
          Join 5,000+ readers who get the latest tools, reviews, and productivity tips every week.
        </p>

        {subscribed ? (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#f4fbf7] text-[#078a4b] text-xs font-medium">
            <Check className="w-4 h-4" />
            <span>Thank you for subscribing!</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-2 pt-1">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-[#e8ece9] bg-[#f8faf9] text-[#101313] placeholder:text-[#8a9099] focus:outline-none focus:border-[#078a4b] focus:bg-white transition"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-semibold transition cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>

      {/* 4. Sticky Sidebar AdSlot (Google AdSense 300x250 / Responsive Display) */}
      <AdSlot variant="sidebar" slotId="sidebar-display" />

      {/* 5. Related Articles Card (Screenshot 2) */}
      {relatedPosts.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-[#e8ece9] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#101313]">
            <FileText className="w-4 h-4 text-[#078a4b]" />
            <span>Related Articles</span>
          </div>

          <div className="space-y-3.5 divide-y divide-[#f0f3f1]">
            {relatedPosts.slice(0, 4).map((rel, idx) => {
              const dateStr = rel.publishedAt
                ? new Date(rel.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Sep 28, 2026";

              const viewsCount = 80 + (idx * 24) + ((rel.claps || 0) * 3);

              return (
                <article key={rel.id} className={`pt-3 ${idx === 0 ? "pt-0" : ""} group`}>
                  <Link href={`/${rel.slug}`} className="flex items-start gap-3">
                    <div className="w-16 h-12 rounded-lg bg-[#f0f0f0] overflow-hidden shrink-0 border border-[#e8ece9]">
                      <img
                        src={
                          rel.featuredImageUrl ||
                          "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=80"
                        }
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-semibold text-xs text-[#101313] group-hover:text-[#078a4b] transition line-clamp-2 leading-snug">
                        {rel.title}
                      </h5>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#8a9099] pt-1">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />
                          <span>{viewsCount} views</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
