"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export interface PostRowItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  tags: string[];
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  publishedAt: string | null;
  createdAt: string;
}

interface PostsListClientProps {
  initialPosts: PostRowItem[];
  initialStatus?: string;
  initialSearch?: string;
}

export default function PostsListClient({
  initialPosts,
  initialStatus = "all",
  initialSearch = "",
}: PostsListClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<PostRowItem[]>(initialPosts);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [search, setSearch] = useState<string>(initialSearch);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const filterTabs = [
    { label: "All Articles", val: "all" },
    { label: "Published", val: "published" },
    { label: "Drafts", val: "draft" },
    { label: "Scheduled", val: "scheduled" },
  ];

  const filtered = posts.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  function toggleSelectAll() {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((p) => p.id));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleDeleteSingle(post: PostRowItem) {
    if (!confirm(`Are you sure you want to permanently delete "${post.title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
        setSelectedIds((prev) => prev.filter((id) => id !== post.id));
        setSuccess(`Article "${post.title}" deleted.`);
        setTimeout(() => setSuccess(null), 3000);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error?.message || "Failed to delete post");
      }
    } catch (err) {
      console.error("Delete post error:", err);
    }
  }

  async function handleBulkDelete() {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.length} selected article(s)? This cannot be undone.`
      )
    )
      return;

    try {
      for (const id of selectedIds) {
        await fetch(`/api/admin/posts/${id}`, { method: "DELETE" }).catch(() => {});
      }
      setPosts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setSuccess(`Deleted ${selectedIds.length} article(s).`);
      setSelectedIds([]);
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch (err) {
      console.error("Bulk delete error:", err);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Content Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
            Posts ({posts.length})
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Manage, review, publish, and delete editorial articles
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-semibold text-xs transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Post</span>
        </Link>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Filters, Bulk Bar, and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.val;
            const count =
              tab.val === "all"
                ? posts.length
                : posts.filter((p) => p.status === tab.val).length;

            return (
              <button
                key={tab.val}
                type="button"
                onClick={() => setStatusFilter(tab.val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#EAF8F0] text-[#079653]"
                    : "text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-[#079653] text-white" : "bg-[#F0F3F1] text-[#667085]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input & Bulk Delete Button */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          )}

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#8a9099] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or slug..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653] focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="rounded-2xl bg-white border border-[#E6EBE8] overflow-hidden shadow-2xs">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-[#8a9099] mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-[#101313]">No articles found</h3>
            <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
              There are no articles matching your filter. Start by clicking the + Create New Post
              button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E6EBE8] text-[11px] font-bold uppercase tracking-wider text-[#667085] bg-[#FAFCFB]">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="accent-[#079653] rounded"
                    />
                  </th>
                  <th className="py-3 px-5">Article</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Tags</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EBE8]">
                {filtered.map((post) => (
                  <tr key={post.id} className="hover:bg-[#F8FAF9] transition">
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(post.id)}
                        onChange={() => toggleSelect(post.id)}
                        className="accent-[#079653] rounded"
                      />
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {post.featuredImageUrl ? (
                          <img
                            src={post.featuredImageUrl}
                            alt={post.featuredImageAlt || post.title}
                            className="w-12 h-8.5 object-cover rounded-lg bg-[#F0F3F1] shrink-0 border border-[#E6EBE8]"
                          />
                        ) : (
                          <div className="w-12 h-8.5 rounded-lg bg-[#F0F3F1] border border-[#E6EBE8] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-[#8a9099]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="font-semibold text-xs text-[#101313] hover:text-[#079653] transition block truncate max-w-md"
                          >
                            {post.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-[#8a9099] font-mono truncate max-w-xs">
                              /{post.slug}
                            </span>
                            <Link
                              href={`/${post.slug}`}
                              target="_blank"
                              className="text-[#8a9099] hover:text-[#079653] transition"
                              title="View Live"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          post.status === "published"
                            ? "bg-[#EAF8F0] text-[#079653]"
                            : post.status === "scheduled"
                            ? "bg-sky-50 text-sky-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-[#F4F6F5] text-[#4b5563] px-2 py-0.5 rounded-md border border-[#E6EBE8]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-xs text-[#667085]">
                      <div>
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : new Date(post.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/${post.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-[#667085] hover:text-[#079653] hover:bg-[#EAF8F0] transition"
                          title="View Live"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="p-1.5 rounded-lg text-[#667085] hover:text-[#079653] hover:bg-[#EAF8F0] transition"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteSingle(post)}
                          className="p-1.5 rounded-lg text-[#667085] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
