"use client";

import { useState, useRef } from "react";
import { HandHeart, Sparkles } from "lucide-react";

interface MediumClapButtonProps {
  initialClaps?: number;
  postId?: string;
  size?: "sm" | "md" | "lg";
}

export default function MediumClapButton({
  initialClaps = 0,
  postId,
  size = "md",
}: MediumClapButtonProps) {
  const [claps, setClaps] = useState(initialClaps);
  const [userClaps, setUserClaps] = useState(0);
  const [isClapping, setIsClapping] = useState(false);
  const [sparkle, setSparkle] = useState<number | null>(null);

  const pendingClapsRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  function syncClapsToDb(amount: number) {
    if (!postId || amount <= 0) return;
    fetch(`/api/v1/posts/${encodeURIComponent(postId)}/claps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    }).catch((err) => console.error("Failed to sync claps:", err));
  }

  function handleClap(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (userClaps >= 50) return; // Medium limit 50 claps per user

    const nextUserClaps = userClaps + 1;
    setUserClaps(nextUserClaps);
    setClaps((prev) => prev + 1);
    setIsClapping(true);
    setSparkle(nextUserClaps);

    pendingClapsRef.current += 1;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const amountToSync = pendingClapsRef.current;
      pendingClapsRef.current = 0;
      syncClapsToDb(amountToSync);
    }, 600);

    setTimeout(() => {
      setIsClapping(false);
    }, 350);

    setTimeout(() => {
      setSparkle(null);
    }, 900);
  }

  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";

  return (
    <div className="relative inline-flex items-center">
      {/* Floating clap bubble animation */}
      {sparkle !== null && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#1a8917] text-white text-[11px] font-semibold animate-bounce shadow-md pointer-events-none z-20 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>+{sparkle}</span>
        </span>
      )}

      <button
        type="button"
        onClick={handleClap}
        aria-label="Clap for this story"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all group cursor-pointer ${
          userClaps > 0
            ? "text-[#1a8917] bg-[#1a8917]/10"
            : "text-[#6b6b6b] hover:text-[#242424] hover:bg-neutral-100"
        } ${isClapping ? "scale-115" : "scale-100"}`}
      >
        <HandHeart
          className={`${iconSize} transition-transform duration-150 ${
            userClaps > 0 ? "fill-[#1a8917]" : "fill-none"
          }`}
        />

        <span className="text-xs sm:text-sm font-medium tabular-nums">
          {claps}
        </span>
      </button>
    </div>
  );
}
