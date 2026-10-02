"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";

interface MediumBookmarkButtonProps {
  slug?: string;
  size?: "sm" | "md";
}

export default function MediumBookmarkButton({
  slug,
  size = "md",
}: MediumBookmarkButtonProps) {
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);

  function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !saved;
    setSaved(nextState);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
    }, 1800);
  }

  const iconClass = size === "sm" ? "w-4 h-4" : "w-4.5 h-4.5";

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleSave}
        title={saved ? "Saved to reading list" : "Save to reading list"}
        className={`p-2 rounded-full transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
          saved
            ? "text-[#078a4b] bg-[#eaf8f0]"
            : "text-[#667085] hover:text-[#101313] hover:bg-[#f8faf9]"
        }`}
      >
        {saved ? (
          <BookmarkCheck className={`${iconClass} fill-[#078a4b]/20 text-[#078a4b]`} />
        ) : (
          <Bookmark className={iconClass} />
        )}
      </button>

      {showToast && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-[#242424] text-white text-[11px] whitespace-nowrap shadow-md z-30">
          {saved ? "Story saved" : "Story removed"}
        </span>
      )}
    </div>
  );
}

