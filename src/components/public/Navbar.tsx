"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Sun, Menu, X, Rss } from "lucide-react";

const TOPICS = [
  { label: "For you", value: "" },
  { label: "AI Tools", value: "AI Tools" },
  { label: "Comparisons", value: "Comparisons" },
  { label: "Freelancers", value: "Freelancers" },
  { label: "Reviews", value: "Reviews" },
  { label: "Tech", value: "Tech" },
  { label: "Productivity", value: "Productivity" },
];

export default function PublicNavbar() {
  const searchParams = useSearchParams();
  const [activeTag, setActiveTag] = useState(searchParams?.get("tag") || searchParams?.get("q") || "");
  const [searchVal, setSearchVal] = useState(searchParams?.get("q") || searchParams?.get("tag") || "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    function handleExternalTagChange(e: Event) {
      const customEvent = e as CustomEvent<{ value: string; isTag?: boolean } | string>;
      const val = typeof customEvent.detail === "string" ? customEvent.detail : customEvent.detail?.value || "";
      setActiveTag(val);
      setSearchVal(val);
    }
    window.addEventListener("stackyup:tag-change", handleExternalTagChange);
    return () => window.removeEventListener("stackyup:tag-change", handleExternalTagChange);
  }, []);

  function handleTopicClick(e: React.MouseEvent, topicValue: string) {
    setActiveTag(topicValue);
    setSearchVal(topicValue);
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/") {
        e.preventDefault();
        const url = new URL(window.location.href);
        url.searchParams.delete("q");
        if (topicValue) {
          url.searchParams.set("tag", topicValue);
        } else {
          url.searchParams.delete("tag");
        }
        window.history.pushState({}, "", url.pathname + (url.search || ""));
        window.dispatchEvent(
          new CustomEvent("stackyup:tag-change", { detail: { value: topicValue, isTag: true } })
        );
      }
    }
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = (formData.get("q") as string)?.trim() || "";

    setActiveTag(query);
    setSearchVal(query);
    setMobileSearchOpen(false);

    if (typeof window !== "undefined") {
      if (window.location.pathname === "/") {
        const url = new URL(window.location.href);
        url.searchParams.delete("tag");
        if (query) {
          url.searchParams.set("q", query);
        } else {
          url.searchParams.delete("q");
        }
        window.history.pushState({}, "", url.pathname + (url.search || ""));
        window.dispatchEvent(
          new CustomEvent("stackyup:tag-change", { detail: { value: query, isTag: false } })
        );
      } else {
        window.location.href = query ? `/?q=${encodeURIComponent(query)}` : "/";
      }
    }
  }

  const currentTag = activeTag;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e8ece9] bg-white/95 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6 lg:gap-8 shrink-0">
          <Link
            href="/"
            onClick={(e) => handleTopicClick(e, "")}
            className="flex items-center gap-1 group"
          >
            <span className="font-bold text-2xl tracking-tight text-[#101313] group-hover:text-black font-sans">
              StackYup<span className="text-[#078a4b]">.</span>
            </span>
          </Link>

          {/* Desktop Topics Navigation (Integrated into Header) */}
          <nav
            aria-label="Topics"
            className="hidden xl:flex items-center gap-6 text-[13px] font-medium text-[#667085]"
          >
            {TOPICS.map((topic) => {
              const isActive = (!currentTag && topic.value === "") || currentTag.toLowerCase() === topic.value.toLowerCase();
              const href = topic.value ? `/?tag=${encodeURIComponent(topic.value)}` : "/";

              return (
                <Link
                  key={topic.label}
                  href={href}
                  onClick={(e) => handleTopicClick(e, topic.value)}
                  className={`py-5 transition-colors relative whitespace-nowrap ${
                    isActive
                      ? "text-[#078a4b] font-semibold"
                      : "hover:text-[#101313]"
                  }`}
                >
                  <span>{topic.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#078a4b] rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Medium Desktop Topics Navigation (1024px - 1279px) */}
        <nav
          aria-label="Topics Compact"
          className="hidden lg:flex xl:hidden items-center gap-4 text-xs font-medium text-[#667085]"
        >
          {TOPICS.slice(0, 5).map((topic) => {
            const isActive = (!currentTag && topic.value === "") || currentTag.toLowerCase() === topic.value.toLowerCase();
            const href = topic.value ? `/?tag=${encodeURIComponent(topic.value)}` : "/";

            return (
              <Link
                key={topic.label}
                href={href}
                onClick={(e) => handleTopicClick(e, topic.value)}
                className={`py-5 transition-colors relative whitespace-nowrap ${
                  isActive ? "text-[#078a4b] font-semibold" : "hover:text-[#101313]"
                }`}
              >
                <span>{topic.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#078a4b] rounded-t-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Search Bar + Theme/RSS Icon */}
        <div className="flex items-center gap-3">
          {/* Desktop Search Input */}
          <form
            onSubmit={handleSearchSubmit}
            action="/"
            method="GET"
            className="relative hidden sm:flex items-center w-64 md:w-72"
          >
            <Search className="w-4 h-4 text-[#8a9099] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              name="q"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search articles, tools, or topics..."
              className="w-full pl-9.5 pr-3.5 py-1.5 rounded-full bg-[#f8faf9] border border-[#e8ece9] hover:border-[#d5dbd7] focus:border-[#078a4b] focus:bg-white text-xs text-[#101313] placeholder:text-[#8a9099] focus:outline-none transition-all"
            />
          </form>

          {/* Theme / Sunlight Icon */}
          <button
            type="button"
            className="p-2 rounded-full text-[#667085] hover:text-[#101313] hover:bg-[#f8faf9] transition cursor-pointer"
            title="Light theme"
            aria-label="Toggle theme"
          >
            <Sun className="w-4 h-4" />
          </button>

          {/* RSS Link */}
          <Link
            href="/rss.xml"
            target="_blank"
            className="hidden sm:inline-flex p-2 rounded-full text-[#667085] hover:text-[#101313] hover:bg-[#f8faf9] transition"
            title="RSS Syndication Feed"
            aria-label="RSS Feed"
          >
            <Rss className="w-4 h-4" />
          </Link>

          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="sm:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#f8faf9] transition cursor-pointer"
            aria-label="Search articles"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#f8faf9] transition cursor-pointer"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Horizontal Topic Strip (1-tap instant category switching) */}
      <div className="lg:hidden border-t border-[#e8ece9] bg-white/95 overflow-x-auto no-scrollbar py-2 px-3 sm:px-4 flex items-center gap-1.5 scroll-smooth">
        {TOPICS.map((topic) => {
          const isActive = (!currentTag && topic.value === "") || currentTag.toLowerCase() === topic.value.toLowerCase();
          const href = topic.value ? `/?tag=${encodeURIComponent(topic.value)}` : "/";

          return (
            <Link
              key={topic.label}
              href={href}
              onClick={(e) => handleTopicClick(e, topic.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? "bg-[#078a4b] text-white font-semibold shadow-2xs"
                  : "bg-[#f4fbf7] text-[#667085] hover:text-[#101313] hover:bg-[#eaf8f0] border border-[#e8ece9]"
              }`}
            >
              {topic.label}
            </Link>
          );
        })}
      </div>

      {/* Mobile Search Input Drawer */}
      {mobileSearchOpen && (
        <div className="sm:hidden px-4 py-3 border-t border-[#e8ece9] bg-[#f8faf9]">
          <form onSubmit={handleSearchSubmit} action="/" method="GET" className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8a9099] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              name="q"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              autoFocus
              placeholder="Search articles, tools, or topics..."
              className="w-full pl-9.5 pr-3.5 py-2.5 rounded-full bg-white border border-[#e8ece9] text-xs text-[#101313] focus:outline-none focus:border-[#078a4b] shadow-2xs"
            />
          </form>
        </div>
      )}

      {/* Mobile Topics & Links Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#e8ece9] bg-white px-4 py-4 space-y-3 shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a9099] px-2 font-sans">
            Categories &amp; Benchmarks
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {TOPICS.map((topic) => {
              const isActive = (!currentTag && topic.value === "") || currentTag.toLowerCase() === topic.value.toLowerCase();
              const href = topic.value ? `/?tag=${encodeURIComponent(topic.value)}` : "/";

              return (
                <Link
                  key={topic.label}
                  href={href}
                  onClick={(e) => {
                    handleTopicClick(e, topic.value);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? "bg-[#eaf8f0] text-[#078a4b] font-semibold"
                      : "text-[#667085] hover:bg-[#f8faf9] hover:text-[#101313]"
                  }`}
                >
                  {topic.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#e8ece9] space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a9099] px-2 font-sans">
              About &amp; Information
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-xs text-[#667085]">
              <Link
                href="/page/about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#f8faf9] hover:text-[#101313] transition"
              >
                About StackYup
              </Link>
              <Link
                href="/page/disclaimer"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#f8faf9] hover:text-[#101313] transition"
              >
                Editorial Disclosure
              </Link>
              <Link
                href="/page/privacy-policy"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#f8faf9] hover:text-[#101313] transition"
              >
                Privacy Policy
              </Link>
              <Link
                href="/rss.xml"
                target="_blank"
                className="px-3 py-2 rounded-lg hover:bg-[#f8faf9] hover:text-[#101313] transition flex items-center gap-1.5 text-[#078a4b]"
              >
                <Rss className="w-3.5 h-3.5" />
                <span>RSS Feed</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
