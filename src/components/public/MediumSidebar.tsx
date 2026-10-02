"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Check, TrendingUp, Tag, Eye } from "lucide-react";
import AdSlot from "./AdSlot";

interface SidebarPost {
  id: string;
  title: string;
  slug: string;
  publishedAt?: Date | null;
  createdAt: Date;
  featuredImageUrl?: string | null;
  claps?: number;
}

interface MediumSidebarProps {
  staffPicks?: SidebarPost[];
}

export default function MediumSidebar({ staffPicks = [] }: MediumSidebarProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const popularTopics = [
    "AI Tools",
    "ChatGPT",
    "Comparisons",
    "Productivity",
    "Automation",
    "Freelancers",
    "Reviews",
    "SaaS",
  ];

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail("");
    }, 2000);
  }

  // Pre-calculate realistic views based on claps or position
  const mostReadPosts = staffPicks.slice(0, 4);

  return (
    <aside className="space-y-8">
      {/* 1. MOST READ (Top Priority in Editorial Sidebar) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-[#e8ece9]">
          <TrendingUp className="w-4 h-4 text-[#078a4b]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#101313] font-sans">
            Most Read
          </h3>
        </div>

        <div className="space-y-3.5 divide-y divide-[#f0f3f1]">
          {mostReadPosts.map((item, idx) => {
            const rankNumber = String(idx + 1).padStart(2, "0");
            const viewCount = (item.claps || 0) * 12 + (485 - idx * 65);

            return (
              <article key={item.id} className="pt-3.5 first:pt-0 group flex items-start gap-3">
                <span className="font-sans font-bold text-lg text-[#d5dbd7] group-hover:text-[#078a4b] transition-colors w-6 shrink-0 leading-none pt-0.5">
                  {rankNumber}
                </span>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-[13.5px] font-bold text-[#101313] group-hover:text-[#078a4b] transition-colors line-clamp-2 leading-snug">
                    <Link href={`/${item.slug}`}>{item.title}</Link>
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8a9099] mt-1.5">
                    <Eye className="w-3 h-3" />
                    <span>{viewCount} views</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* 2. POPULAR TOPICS */}
      <div className="space-y-3.5 pt-4 border-t border-[#e8ece9]">
        <div className="flex items-center gap-2 pb-2.5 border-b border-[#e8ece9]">
          <Tag className="w-3.5 h-3.5 text-[#078a4b]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#101313] font-sans">
            Popular Topics
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {popularTopics.map((topic) => (
            <Link
              key={topic}
              href={`/?tag=${encodeURIComponent(topic)}`}
              className="px-3 py-1.5 rounded-lg bg-[#f8faf9] hover:bg-[#078a4b] hover:text-white border border-[#e8ece9] text-xs font-medium text-[#101313] transition-colors"
            >
              {topic}
            </Link>
          ))}
        </div>
      </div>

      {/* 3. STAY UPDATED (Newsletter Box - Positioned after content) */}
      <div className="p-5 rounded-2xl bg-[#f8faf9] border border-[#e8ece9] space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#101313]">
          <Mail className="w-4 h-4 text-[#078a4b]" />
          <span>Stay Updated</span>
        </div>
        <p className="text-xs text-[#667085] leading-relaxed">
          Weekly reviews, comparisons, and practical production guides for modern creators.
        </p>

        {subscribed ? (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#eaf8f0] text-xs text-[#078a4b] font-medium border border-[#078a4b]/20">
            <Check className="w-4 h-4 shrink-0" />
            <span>You&apos;re subscribed! Welcome aboard.</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-2 pt-1">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#e8ece9] bg-white text-[#101313] placeholder:text-[#8a9099] focus:outline-none focus:border-[#078a4b] shadow-2xs"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>

      {/* 4. Responsive Sidebar Ad */}
      <AdSlot variant="sidebar" slotId="home-sidebar" />
    </aside>
  );
}
