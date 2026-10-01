import Link from "next/link";
import { Sparkles, Rss, Heart } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#070b14] mt-20 pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/60">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold tracking-tight text-white text-lg">StackYup</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              StackYup delivers independent, data-backed reviews and benchmarks of generative AI tools, LLMs, and SaaS products. Designed to help creators, freelancers, and engineers choose the best software stack.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Target Audience: US/UK AI Enthusiasts &amp; Professionals</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Categories</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/?tag=AI%20Tools" className="hover:text-white transition">
                  AI Tools &amp; Agents
                </Link>
              </li>
              <li>
                <Link href="/?tag=Comparisons" className="hover:text-white transition">
                  Tool Comparisons
                </Link>
              </li>
              <li>
                <Link href="/?tag=Freelancers" className="hover:text-white transition">
                  Freelance Productivity
                </Link>
              </li>
              <li>
                <Link href="/rss.xml" target="_blank" className="hover:text-amber-400 transition flex items-center gap-1">
                  <Rss className="w-3 h-3 text-amber-400" />
                  <span>RSS Feed</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional / Legal Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Information</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/page/about" className="hover:text-white transition">
                  About StackYup
                </Link>
              </li>
              <li>
                <Link href="/page/contact" className="hover:text-white transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/page/privacy-policy" className="hover:text-white transition">
                  Privacy Policy (GDPR/CCPA)
                </Link>
              </li>
              <li>
                <Link href="/page/disclaimer" className="hover:text-white transition">
                  Affiliate &amp; Ad Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} StackYup. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Powered by StackYup CMS v1.0 • Built with Next.js 16 &amp; Neon Postgres</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
