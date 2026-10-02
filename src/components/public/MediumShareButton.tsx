"use client";

import { useState } from "react";
import { Share2, Check, Copy, ExternalLink } from "lucide-react";

interface MediumShareButtonProps {
  url?: string;
  title?: string;
}

export default function MediumShareButton({ url, title }: MediumShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? url || window.location.href : url || "";
  const shareTitle = title || "StackYup Article";

  async function copyToClipboard(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  function shareTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shareLinkedin() {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Share this story"
        className="p-2 rounded-full text-[#667085] hover:text-[#101313] hover:bg-[#f8faf9] transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
      >
        <Share2 className="w-4.5 h-4.5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 bottom-full mb-2 w-48 rounded-xl bg-white border border-[#e8ece9] shadow-xl py-1.5 z-30 text-xs text-[#101313]">
            <button
              type="button"
              onClick={copyToClipboard}
              className="w-full px-3.5 py-2 text-left hover:bg-[#f8faf9] flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-2">
                {copied ? (
                  <Check className="w-4 h-4 text-[#078a4b]" />
                ) : (
                  <Copy className="w-4 h-4 text-[#667085]" />
                )}
                <span className={copied ? "text-[#078a4b] font-medium" : ""}>
                  {copied ? "Link copied!" : "Copy link"}
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={shareTwitter}
              className="w-full px-3.5 py-2 text-left hover:bg-neutral-50 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-[#242424]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Share on X</span>
              </div>
              <ExternalLink className="w-3 h-3 text-[#8a8a8a]" />
            </button>
            <button
              type="button"
              onClick={shareLinkedin}
              className="w-full px-3.5 py-2 text-left hover:bg-neutral-50 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-[#0a66c2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span>Share on LinkedIn</span>
              </div>
              <ExternalLink className="w-3 h-3 text-[#8a8a8a]" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

