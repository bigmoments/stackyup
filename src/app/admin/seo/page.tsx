import { db, schema } from "@/db";
import Link from "next/link";
import { Search, AlertCircle, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SEO Health & Audit — StackYup Admin",
};

export default async function AdminSeoPage() {
  const allPosts = await db.select().from(schema.posts);

  // Analyze SEO health
  const missingMetaDesc = allPosts.filter(
    (p) => !p.metaDescription || p.metaDescription.trim().length === 0
  );
  const missingFeaturedImage = allPosts.filter((p) => !p.featuredImageUrl);
  const missingAlt = allPosts.filter(
    (p) => p.featuredImageUrl && (!p.featuredImageAlt || p.featuredImageAlt.trim().length === 0)
  );
  const shortContent = allPosts.filter(
    (p) => (p.contentHtml || "").replace(/<[^>]*>/g, "").split(/\s+/).length < 300
  );

  const perfectPosts = allPosts.filter(
    (p) =>
      p.metaDescription &&
      p.metaDescription.length >= 100 &&
      p.featuredImageUrl &&
      p.featuredImageAlt
  );

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
          Search Engine Optimization
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
          SEO Health Overview
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Actionable diagnostics to ensure all published content ranks competitively on Google SERP.
        </p>
      </div>

      {/* 4 Diagnostic Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Missing Meta Description</span>
          <span className={`text-2xl font-extrabold block ${missingMetaDesc.length > 0 ? "text-amber-600" : "text-[#079653]"}`}>
            {missingMetaDesc.length}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Missing Image Alt Text</span>
          <span className={`text-2xl font-extrabold block ${missingAlt.length > 0 ? "text-amber-600" : "text-[#079653]"}`}>
            {missingAlt.length}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Missing Cover Image</span>
          <span className={`text-2xl font-extrabold block ${missingFeaturedImage.length > 0 ? "text-rose-600" : "text-[#079653]"}`}>
            {missingFeaturedImage.length}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">SEO Optimized Articles</span>
          <span className="text-2xl font-extrabold text-[#079653] block">
            {perfectPosts.length} / {allPosts.length}
          </span>
        </div>
      </div>

      {/* Actionable Issues List */}
      <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
        <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span>Articles Needing SEO Attention</span>
        </h3>

        {missingMetaDesc.length === 0 && missingAlt.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#079653] mx-auto mb-2" />
            <h4 className="font-bold text-sm text-[#101313]">All Articles Pass Core SEO Audits!</h4>
            <p className="text-xs text-[#667085] mt-1">All published articles have descriptive meta descriptions and valid image alt tags.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6EBE8]">
            {missingMetaDesc.map((post) => (
              <div key={post.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="font-semibold text-xs text-[#101313] block">
                    {post.title}
                  </span>
                  <span className="text-[11px] text-amber-600 font-medium">
                    Issue: Missing meta description (affects Google snippet click-through rate)
                  </span>
                </div>

                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="px-3 py-1.5 rounded-lg border border-[#E6EBE8] hover:border-[#079653] text-[#079653] hover:bg-[#EAF8F0] text-xs font-semibold transition shrink-0"
                >
                  Fix in Editor →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
