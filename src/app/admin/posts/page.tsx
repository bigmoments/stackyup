import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Plus, Search, ExternalLink, Edit3, Trash2, FileText } from "lucide-react";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

interface PostsPageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function AdminPostsPage({ searchParams }: PostsPageProps) {
  const { status, search } = await searchParams;

  const whereCondition = status && status !== "all"
    ? eq(schema.posts.status, status)
    : undefined;

  let allPosts = await db
    .select()
    .from(schema.posts)
    .where(whereCondition)
    .orderBy(desc(schema.posts.createdAt));

  if (search && search.trim()) {
    const q = search.toLowerCase();
    allPosts = allPosts.filter(
      (p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
    );
  }

  const filterTabs = [
    { label: "All Articles", val: "all" },
    { label: "Published", val: "published" },
    { label: "Drafts", val: "draft" },
    { label: "Scheduled", val: "scheduled" },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Articles</h1>
          <p className="text-xs text-slate-400 mt-1">Manage, edit, and publish your blog articles</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/25"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </Link>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {filterTabs.map((tab) => {
            const isActive = (!status && tab.val === "all") || status === tab.val;
            return (
              <Link
                key={tab.val}
                href={`/admin/posts?status=${tab.val}${search ? `&search=${search}` : ""}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Search Input */}
        <form method="GET" className="relative w-full md:w-72">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="search"
            defaultValue={search || ""}
            placeholder="Search by title or slug..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </form>
      </div>

      {/* Posts Table */}
      <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden shadow-xl">
        {allPosts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No articles found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no articles matching your filter. Start by publishing via API or click the New Article button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 bg-slate-950/40">
                  <th className="py-4 px-6">Article</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Tags</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {post.featuredImageUrl ? (
                          <img
                            src={post.featuredImageUrl}
                            alt={post.featuredImageAlt || post.title}
                            className="w-12 h-12 object-cover rounded-lg bg-slate-800 shrink-0 border border-slate-800"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-slate-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="font-semibold text-slate-100 hover:text-indigo-400 transition block truncate max-w-md"
                          >
                            {post.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 font-mono truncate max-w-xs">
                              /{post.slug}
                            </span>
                            <Link
                              href={`/${post.slug}`}
                              target="_blank"
                              className="text-slate-500 hover:text-indigo-400 transition"
                              title="View Live"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
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
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(post.tags as string[])?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      <div>
                        {post.publishedAt
                          ? `Published: ${new Date(post.publishedAt).toLocaleDateString()}`
                          : `Created: ${new Date(post.createdAt).toLocaleDateString()}`}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
