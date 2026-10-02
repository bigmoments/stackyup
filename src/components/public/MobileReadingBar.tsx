"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import MediumClapButton from "./MediumClapButton";
import MediumBookmarkButton from "./MediumBookmarkButton";
import MediumShareButton from "./MediumShareButton";

interface MobileReadingBarProps {
  postId: string;
  initialClaps: number;
  commentsCount: number;
  slug: string;
  title: string;
  articleUrl: string;
}

export default function MobileReadingBar({
  postId,
  initialClaps,
  commentsCount,
  slug,
  title,
  articleUrl,
}: MobileReadingBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      // Show when scrolled past header (> 220px)
      if (window.scrollY > 220) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="lg:hidden fixed bottom-4 inset-x-3 z-40 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="bg-white/95 backdrop-blur-md border border-[#e8ece9] rounded-full shadow-lg px-4 py-2 flex items-center justify-between gap-3 text-[#667085]">
        {/* Left: Claps */}
        <div className="flex items-center gap-1.5">
          <MediumClapButton
            postId={postId}
            initialClaps={initialClaps}
            size="sm"
          />
        </div>

        {/* Divider */}
        <div className="h-4 w-[1px] bg-[#e8ece9]" />

        {/* Middle: Jump to Responses */}
        <a
          href="#responses"
          className="flex items-center gap-1.5 text-xs font-medium hover:text-[#101313] transition py-1 px-2 rounded-full hover:bg-[#f8faf9]"
          title="Jump to responses"
        >
          <MessageCircle className="w-4 h-4 text-[#8a9099]" />
          <span className="tabular-nums">{commentsCount}</span>
        </a>

        {/* Divider */}
        <div className="h-4 w-[1px] bg-[#e8ece9]" />

        {/* Right: Bookmark + Share */}
        <div className="flex items-center gap-1">
          <MediumBookmarkButton slug={slug} size="sm" />
          <MediumShareButton url={articleUrl} title={title} />
        </div>
      </div>
    </div>
  );
}
