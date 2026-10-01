import Link from "next/link";
import { Sparkles, Rss, Search } from "lucide-react";

export default function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070b14]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold tracking-tight text-white text-lg">StackYup</span>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Reviews</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <Link href="/" className="hover:text-indigo-400 transition">
            Latest Reviews
          </Link>
          <Link href="/?tag=AI%20Tools" className="hover:text-indigo-400 transition">
            AI Tools
          </Link>
          <Link href="/?tag=Comparisons" className="hover:text-indigo-400 transition">
            Comparisons
          </Link>
          <Link href="/page/about" className="hover:text-indigo-400 transition">
            About Us
          </Link>
        </nav>

        {/* Action icons */}
        <div className="flex items-center gap-3">
          <Link
            href="/rss.xml"
            target="_blank"
            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-900 border border-slate-800 transition"
            title="RSS Feed"
          >
            <Rss className="w-4 h-4" />
          </Link>

          <Link
            href="/admin"
            className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
