import Link from "next/link";
import { count, eq, desc } from "drizzle-orm";
import {
  FileText,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Key,
  Layers,
  Plus,
  UploadCloud,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    totalPosts,
    draftPosts,
    publishedPosts,
    scheduledPosts,
    totalMedia,
    totalPages,
    activeKeys,
    recentPosts,
  ] = await Promise.all([
    db.select({ count: count() }).from(schema.posts),
    db.select({ count: count() }).from(schema.posts).where(eq(schema.posts.status, "draft")),
    db.select({ count: count() }).from(schema.posts).where(eq(schema.posts.status, "published")),
    db.select({ count: count() }).from(schema.posts).where(eq(schema.posts.status, "scheduled")),
    db.select({ count: count() }).from(schema.media),
    db.select({ count: count() }).from(schema.pages),
    db.select({ count: count() }).from(schema.apiKeys).where(eq(schema.apiKeys.isActive, true)),
    db
      .select()
      .from(schema.posts)
      .orderBy(desc(schema.posts.createdAt))
      .limit(6),
  ]);

  const stats = [
    {
      label: "Total Articles",
      value: totalPosts[0]?.count || 0,
      icon: FileText,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      label: "Published",
      value: publishedPosts[0]?.count || 0,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Drafts",
      value: draftPosts[0]?.count || 0,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Media Items",
      value: totalMedia[0]?.count || 0,
      icon: ImageIcon,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
    },
    {
      label: "Static Pages",
      value: totalPages[0]?.count || 0,
      icon: Layers,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      label: "Active API Keys",
      value: activeKeys[0]?.count || 0,
      icon: Key,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fase 1 API & Fase 2 Admin Live</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Welcome to StackYup CMS
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Headless blog engine ready for automated Muse publishing, high-performance SEO, and manual content editing.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          <Link
            href="/admin/posts/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/25"
          >
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </Link>
          <Link
            href="/admin/import"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import Blogger</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`p-4 rounded-xl bg-slate-900/50 border ${stat.border} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Publishing API Status & Quick Reference */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <h3 className="text-sm font-semibold text-white">Publishing API Engine Active</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Endpoint: <code>/api/v1/posts</code> & <code>/api/v1/media</code> (Bearer token authenticated)
            </p>
          </div>
        </div>
        <Link
          href="/admin/api-keys"
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          <span>Manage API Keys</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Recent Posts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">Recent Articles</h2>
          <Link
            href="/admin/posts"
            className="text-xs font-medium text-slate-400 hover:text-slate-200 transition flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
          {recentPosts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No articles found. Create your first article or publish via API!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 bg-slate-950/40">
                    <th className="py-3.5 px-6">Title</th>
                    <th className="py-3.5 px-6">Slug</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-6 font-medium text-slate-100 max-w-xs truncate">
                        {post.title}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-400 font-mono">
                        /{post.slug}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            post.status === "published"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : post.status === "scheduled"
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
