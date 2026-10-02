"use client";

import { useState } from "react";
import { List, ChevronDown, ChevronUp } from "lucide-react";
import { TocItem } from "@/lib/toc";

interface TableOfContentsProps {
  headings: TocItem[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!headings || headings.length === 0) return null;

  return (
    <nav
      aria-label="Table of Contents"
      className="my-7 rounded-xl bg-white border border-[#e8ece9] p-5 sm:p-6 shadow-xs transition-all"
    >
      <div
        className="flex items-center justify-between cursor-pointer select-none min-h-[44px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5">
          <List className="w-4.5 h-4.5 text-[#078a4b]" />
          <h2 className="font-sans font-bold text-sm sm:text-base text-[#101313] tracking-tight m-0">
            Table of Contents
          </h2>
        </div>

        <button
          type="button"
          aria-expanded={isOpen}
          className="text-xs text-[#667085] hover:text-[#101313] flex items-center gap-1 transition font-medium min-h-[44px] px-2"
        >
          <span>{isOpen ? "Collapse" : "Expand"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <ol className="mt-4 pt-4 border-t border-[#e8ece9] grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 list-none pl-0 text-xs sm:text-[13px]">
          {headings.map((item, idx) => {
            const cleanText = item.text.replace(/^\d+[\.\)]\s*/, "");
            return (
              <li key={item.id} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#f4fbf7] text-[#078a4b] text-[11px] font-bold flex items-center justify-center shrink-0 border border-[#e8ece9]">
                  {idx + 1}
                </span>
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
                      window.history.pushState(null, "", `#${item.id}`);
                    }
                  }}
                  className="text-[#667085] hover:text-[#078a4b] transition-colors leading-snug line-clamp-1 font-medium py-1.5 flex-1"
                >
                  {cleanText}
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}
