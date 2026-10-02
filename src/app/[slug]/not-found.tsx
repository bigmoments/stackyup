import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Home, Search, BookOpen, Sparkles, Layers, FileQuestion } from "lucide-react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

export default function ArticleNotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Navigation */}
      <Suspense fallback={<div className="h-16 border-b border-[#e8ece9] bg-white" />}>
        <PublicNavbar />
      </Suspense>

      <main className="flex-1 flex items-center justify-center py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-2xl w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4fbf7] border border-[#e8ece9] text-[#078a4b] text-xs font-semibold uppercase tracking-wider mb-6">
            <FileQuestion className="w-3.5 h-3.5 text-[#078a4b]" />
            Story Not Found
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#101313] mb-4 font-sans">
            This article has moved or is unpublished.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#667085] leading-relaxed max-w-xl mx-auto mb-8 font-sans">
            The article or review you are trying to read may have been updated with a new link, archived, or removed by our editors.
          </p>

          {/* Search bar */}
          <div className="max-w-md mx-auto mb-10">
            <form action="/" method="GET" className="relative flex items-center shadow-xs">
              <Search className="w-5 h-5 absolute left-3.5 text-[#8a9099] pointer-events-none" />
              <input
                type="text"
                name="search"
                placeholder="Search other articles & reviews..."
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

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#101313] text-white text-sm font-medium hover:bg-black transition shadow-xs"
            >
              <Home className="w-4 h-4" />
              <span>Back to Homepage</span>
            </Link>
            <Link
              href="/?tag=Reviews"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#e8ece9] text-[#101313] text-sm font-medium hover:bg-[#f8faf9] transition"
            >
              <BookOpen className="w-4 h-4 text-[#078a4b]" />
              <span>Browse All Reviews</span>
            </Link>
          </div>

          {/* Popular Categories */}
          <div className="border-t border-[#e8ece9] pt-8 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8a9099] mb-4 text-center">
              Trending Sections
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/?tag=AI%20Tools"
                className="px-3.5 py-1.5 rounded-lg border border-[#e8ece9] bg-[#f8faf9] text-xs font-medium text-[#101313] hover:border-[#078a4b] hover:bg-white transition"
              >
                🤖 AI Tools
              </Link>
              <Link
                href="/?tag=Comparisons"
                className="px-3.5 py-1.5 rounded-lg border border-[#e8ece9] bg-[#f8faf9] text-xs font-medium text-[#101313] hover:border-[#078a4b] hover:bg-white transition"
              >
                ⚖️ Head-to-Head Comparisons
              </Link>
              <Link
                href="/?tag=Tech"
                className="px-3.5 py-1.5 rounded-lg border border-[#e8ece9] bg-[#f8faf9] text-xs font-medium text-[#101313] hover:border-[#078a4b] hover:bg-white transition"
              >
                💻 Tech Architecture
              </Link>
              <Link
                href="/?tag=Freelancers"
                className="px-3.5 py-1.5 rounded-lg border border-[#e8ece9] bg-[#f8faf9] text-xs font-medium text-[#101313] hover:border-[#078a4b] hover:bg-white transition"
              >
                💼 Freelancer Stack
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
