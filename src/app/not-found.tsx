import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Home, Search, Compass, BookOpen, Layers, Sparkles, HelpCircle } from "lucide-react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Navigation */}
      <Suspense fallback={<div className="h-16 border-b border-[#e8ece9] bg-white" />}>
        <PublicNavbar />
      </Suspense>

      <main className="flex-1 flex items-center justify-center py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-2xl w-full text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4fbf7] border border-[#e8ece9] text-[#078a4b] text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-[#078a4b] animate-pulse"></span>
            404 — Page Not Found
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#101313] mb-4 font-sans">
            We lost this story in the stack.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#667085] leading-relaxed max-w-xl mx-auto mb-8 font-sans">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          {/* Interactive Search Bar */}
          <div className="max-w-md mx-auto mb-10">
            <form
              action="/"
              method="GET"
              className="relative flex items-center shadow-xs"
            >
              <Search className="w-5 h-5 absolute left-3.5 text-[#8a9099] pointer-events-none" />
              <input
                type="text"
                name="search"
                placeholder="Search reviews, comparisons, AI tools..."
                className="w-full pl-11 pr-24 py-3 bg-[#f8faf9] border border-[#e8ece9] rounded-xl text-sm text-[#101313] placeholder-[#8a9099] focus:outline-hidden focus:border-[#078a4b] focus:bg-white focus:ring-2 focus:ring-[#078a4b]/20 transition"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-1.5 bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-medium rounded-lg transition"
              >
                Search
              </button>
            </form>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#101313] text-white text-sm font-medium hover:bg-black transition shadow-xs"
            >
              <Home className="w-4 h-4" />
              <span>Back to Homepage</span>
            </Link>
            <Link
              href="/?tag=AI%20Tools"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#e8ece9] text-[#101313] text-sm font-medium hover:bg-[#f8faf9] transition"
            >
              <Sparkles className="w-4 h-4 text-[#078a4b]" />
              <span>Explore AI Tools</span>
            </Link>
          </div>

          {/* Quick Category Exploration */}
          <div className="border-t border-[#e8ece9] pt-10 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8a9099] mb-4 text-center">
              Or jump into one of our popular topics:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/?tag=AI%20Tools"
                className="p-3 rounded-xl border border-[#e8ece9] bg-[#f8faf9] hover:bg-white hover:border-[#078a4b]/40 hover:shadow-xs transition group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-[#078a4b]" />
                  <span className="text-sm font-semibold text-[#101313] group-hover:text-[#078a4b] transition">
                    AI Tools
                  </span>
                </div>
                <p className="text-[11px] text-[#667085]">LLMs, coding assistants & models</p>
              </Link>

              <Link
                href="/?tag=Comparisons"
                className="p-3 rounded-xl border border-[#e8ece9] bg-[#f8faf9] hover:bg-white hover:border-[#078a4b]/40 hover:shadow-xs transition group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-[#078a4b]" />
                  <span className="text-sm font-semibold text-[#101313] group-hover:text-[#078a4b] transition">
                    Comparisons
                  </span>
                </div>
                <p className="text-[11px] text-[#667085]">Side-by-side empirical benchmarks</p>
              </Link>

              <Link
                href="/?tag=Reviews"
                className="p-3 rounded-xl border border-[#e8ece9] bg-[#f8faf9] hover:bg-white hover:border-[#078a4b]/40 hover:shadow-xs transition group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-[#078a4b]" />
                  <span className="text-sm font-semibold text-[#101313] group-hover:text-[#078a4b] transition">
                    Reviews
                  </span>
                </div>
                <p className="text-[11px] text-[#667085]">In-depth hands-on breakdowns</p>
              </Link>

              <Link
                href="/page/about"
                className="p-3 rounded-xl border border-[#e8ece9] bg-[#f8faf9] hover:bg-white hover:border-[#078a4b]/40 hover:shadow-xs transition group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle className="w-4 h-4 text-[#078a4b]" />
                  <span className="text-sm font-semibold text-[#101313] group-hover:text-[#078a4b] transition">
                    About Us
                  </span>
                </div>
                <p className="text-[11px] text-[#667085]">Our editorial methodology</p>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
