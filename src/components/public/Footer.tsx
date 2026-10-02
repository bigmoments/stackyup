import Link from "next/link";
import { Rss, Globe, ShieldCheck, FileText, Mail } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="w-full border-t border-[#e8ece9] bg-[#f8faf9] mt-20 sm:mt-24 py-12 text-[#667085] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#e8ece9]">
          {/* Brand & Description */}
          <div className="md:col-span-6 space-y-3">
            <Link href="/" className="inline-block group">
              <span className="font-sans font-bold text-2xl tracking-tight text-[#101313] group-hover:text-black">
                StackYup<span className="text-[#078a4b]">.</span>
              </span>
            </Link>
            <p className="text-[#667085] leading-relaxed max-w-md text-xs sm:text-sm font-sans">
              Independent benchmarks, honest comparisons, and empirical reviews of modern AI and productivity tools. Built for thinkers, builders, and solo operators.
            </p>
          </div>

          {/* Topics Column */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="font-bold text-[#101313] tracking-wider uppercase text-[11px] font-sans">
              Explore Topics
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/?tag=AI%20Tools" className="py-1 inline-block hover:text-[#078a4b] transition">
                  AI Tools &amp; LLMs
                </Link>
              </li>
              <li>
                <Link href="/?tag=Comparisons" className="py-1 inline-block hover:text-[#078a4b] transition">
                  Head-to-Head Comparisons
                </Link>
              </li>
              <li>
                <Link href="/?tag=Freelancers" className="py-1 inline-block hover:text-[#078a4b] transition">
                  Freelance Productivity
                </Link>
              </li>
              <li>
                <Link href="/?tag=Reviews" className="py-1 inline-block hover:text-[#078a4b] transition">
                  Software Reviews
                </Link>
              </li>
            </ul>
          </div>

          {/* Publication Links */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="font-bold text-[#101313] tracking-wider uppercase text-[11px] font-sans">
              StackYup
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/page/about" className="py-1 inline-flex items-center gap-1.5 hover:text-[#078a4b] transition">
                  <Globe className="w-3.5 h-3.5 text-[#8a9099]" />
                  <span>About Our Publication</span>
                </Link>
              </li>
              <li>
                <Link href="/page/privacy-policy" className="py-1 inline-flex items-center gap-1.5 hover:text-[#078a4b] transition">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8a9099]" />
                  <span>Privacy Policy &amp; Terms</span>
                </Link>
              </li>
              <li>
                <Link href="/page/disclaimer" className="py-1 inline-flex items-center gap-1.5 hover:text-[#078a4b] transition">
                  <FileText className="w-3.5 h-3.5 text-[#8a9099]" />
                  <span>Editorial Independence</span>
                </Link>
              </li>
              <li>
                <Link href="/rss.xml" target="_blank" className="py-1 inline-flex items-center gap-1.5 hover:text-[#078a4b] transition text-[#078a4b] font-medium">
                  <Rss className="w-3.5 h-3.5" />
                  <span>RSS Syndication</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#8a9099] text-[11px]">
          <p>© {new Date().getFullYear()} StackYup Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="hover:text-[#101313] transition py-1">
              Publisher Admin
            </Link>
            <span>•</span>
            <Link href="/page/contact" className="hover:text-[#101313] transition py-1 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span>Contact Editorial</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

