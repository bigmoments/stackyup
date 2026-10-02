import Link from "next/link";
import { ArrowRight, Sparkles, Zap, CheckCircle2, TrendingUp, ShieldCheck } from "lucide-react";

export default function HomepageHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#F4FBF7] via-white to-[#EAF8F0] border border-[#E8ECE9] p-5 sm:p-8 lg:p-12 mb-8 sm:mb-12 shadow-2xs">
      {/* Subtle decorative background gradient circles */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#078a4b]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-60 h-60 rounded-full bg-[#078a4b]/8 blur-2xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Column: Heading & Content */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          {/* Label Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8ECE9] text-xs font-semibold text-[#078a4b] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#078a4b] animate-pulse" />
            <span>Latest Insights &amp; Benchmarks</span>
          </div>

          {/* Real HTML H1 */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-bold text-[#101313] leading-[1.18] sm:leading-[1.14] tracking-tight">
            Discover the Best{" "}
            <span className="text-[#078a4b] bg-clip-text">AI Tools for Freelancers</span>{" "}
            and Modern Creators
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base lg:text-lg text-[#667085] leading-relaxed max-w-xl">
            In-depth reviews, honest comparisons, and practical production guides to help you work smarter, faster, and scale your freelance career with confidence.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
            <a
              href="#articles"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white font-semibold text-sm transition-all shadow-xs hover:shadow min-h-[44px]"
            >
              <span>Browse All Articles</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              href="/?tag=Comparisons"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-neutral-50 text-[#101313] border border-[#E8ECE9] font-medium text-sm transition-colors min-h-[44px]"
            >
              <Sparkles className="w-4 h-4 text-[#078a4b]" />
              <span>Compare Models</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Editorial Visual Card / Tech Composition */}
        <div className="lg:col-span-5 relative">
          <div className="relative mx-auto max-w-md bg-white rounded-2xl border border-[#E8ECE9] p-5 shadow-sm space-y-4">
            {/* Top Bar of the Mock Card */}
            <div className="flex items-center justify-between border-b border-[#E8ECE9] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                <span className="text-xs font-mono text-[#8A9099] ml-2">stackyup/benchmarks-2026</span>
              </div>
              <span className="text-[11px] font-semibold text-[#078a4b] bg-[#F4FBF7] px-2 py-0.5 rounded border border-[#E8ECE9]">
                Live Teardown
              </span>
            </div>

            {/* Interactive Stat Cards Inside */}
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#F4FBF7] border border-[#E8ECE9] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#078a4b] text-white flex items-center justify-center font-bold text-xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#101313]">Autonomous Workflow</p>
                    <p className="text-[11px] text-[#667085]">Save up to 18 hrs/week on research</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#078a4b]">+84% speed</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E8ECE9] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#101313]">Claude 3.7 vs GPT-4.5</p>
                    <p className="text-[11px] text-[#667085]">Production accuracy benchmarks</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600">98.2% score</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E8ECE9] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#101313] text-white flex items-center justify-center font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-[#078a4b]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#101313]">Independent &amp; Unbiased</p>
                    <p className="text-[11px] text-[#667085]">No paid sponsor ranking guarantee</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#667085] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#078a4b]" /> Verified
                </span>
              </div>
            </div>

            {/* Bottom mini metric */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-[#8A9099] border-t border-[#E8ECE9]">
              <span>Updated daily for 2026 stack</span>
              <span className="text-[#078a4b] font-medium">Free open guides</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
