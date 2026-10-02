"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Clock,
  Sparkles,
  Save,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  ThumbsUp,
} from "lucide-react";

export interface AnalyticsPostSummary {
  id: string;
  title: string;
  slug: string;
  category: string;
  claps: number;
  estimatedViews: number;
  comments: number;
  publishedAt: string;
}

interface AnalyticsClientProps {
  stats: {
    totalPosts: number;
    totalPublished: number;
    totalDrafts: number;
    totalClaps: number;
    estimatedViews: number;
    totalComments: number;
    totalSubscribers: number;
  };
  topPosts: AnalyticsPostSummary[];
  initialGaId: string;
  initialPlausible: string;
}

export default function AnalyticsClient({
  stats,
  topPosts,
  initialGaId,
  initialPlausible,
}: AnalyticsClientProps) {
  const router = useRouter();
  const [gaId, setGaId] = useState(initialGaId);
  const [plausible, setPlausible] = useState(initialPlausible);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSaveTracking(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_analytics_id: gaId.trim(),
          plausible_domain: plausible.trim(),
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.refresh();
      } else {
        alert("Failed to save tracking settings");
      }
    } catch (err) {
      console.error("Save tracking error:", err);
    } finally {
      setLoading(false);
    }
  }

  const isTrackingActive = Boolean(gaId.trim() || plausible.trim());

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
          Performance Intelligence
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
          Traffic & Content Analytics
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Audience engagement, real content metrics, and third-party web analytics tracking.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Analytics tracking settings updated successfully!</span>
        </div>
      )}

      {/* Real Core Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Estimated Total Reads</span>
          <span className="text-2xl font-extrabold text-[#101313] block">
            {stats.estimatedViews.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#079653] font-bold">
            From {stats.totalPublished} published articles
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Total Article Claps</span>
          <span className="text-2xl font-extrabold text-[#101313] block">
            {stats.totalClaps.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#079653] font-bold">Reader appreciation</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Audience Comments</span>
          <span className="text-2xl font-extrabold text-[#101313] block">
            {stats.totalComments.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#079653] font-bold">Community discussions</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Active Subscribers</span>
          <span className="text-2xl font-extrabold text-[#101313] block">
            {stats.totalSubscribers.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#079653] font-bold">Direct newsletter reach</span>
        </div>
      </div>

      {/* Main Grid: Real Top Content + External Analytics Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Real Content Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE8]">
            <h3 className="font-bold text-sm text-[#101313]">Top Performing Content</h3>
            <span className="text-xs text-[#667085]">Ranked by claps & engagement</span>
          </div>

          {topPosts.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#667085]">
              No published articles available yet. Publish stories to see analytics!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E6EBE8] text-[11px] font-bold uppercase tracking-wider text-[#667085] bg-[#FAFCFB]">
                    <th className="py-2.5 px-3">Article Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Claps</th>
                    <th className="py-2.5 px-3 text-center">Est. Views</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EBE8]">
                  {topPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-[#F8FAF9] transition">
                      <td className="py-3 px-3 font-semibold text-xs text-[#101313]">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="hover:text-[#079653] transition block truncate max-w-sm"
                        >
                          {post.title}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F4F6F5] text-[#4b5563]">
                          {post.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-center font-bold text-[#101313]">
                        {post.claps}
                      </td>
                      <td className="py-3 px-3 text-xs text-center font-bold text-[#079653]">
                        {post.estimatedViews}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/${post.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-[#667085] hover:text-[#079653] hover:bg-[#EAF8F0] transition inline-block"
                          title="View Live Article"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Connect External Analytics Form */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE8]">
            <h3 className="font-bold text-sm text-[#101313]">Live Tracking Setup</h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isTrackingActive
                  ? "bg-[#EAF8F0] text-[#079653]"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {isTrackingActive ? "Tracking Active" : "Unconfigured"}
            </span>
          </div>

          <form onSubmit={handleSaveTracking} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">
                Google Analytics 4 Measurement ID
              </label>
              <input
                type="text"
                value={gaId}
                onChange={(e) => setGaId(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs font-mono text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
              />
              <span className="text-[10px] text-[#667085] mt-1 block">
                Automatically loads gtag.js on all public articles.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">
                Plausible / Umami Domain
              </label>
              <input
                type="text"
                value={plausible}
                onChange={(e) => setPlausible(e.target.value)}
                placeholder="stackyup.com"
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs font-mono text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
              />
              <span className="text-[10px] text-[#667085] mt-1 block">
                Privacy-focused cookieless analytics alternative.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Saving..." : "Save Analytics Config"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
