"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  FileText,
  MessageSquare,
  Mail,
  Calendar,
  ChevronDown,
  Plus,
  Sparkles,
  Camera,
  FolderTree,
  ExternalLink,
  MoreVertical,
  ArrowRight,
  TrendingUp,
  Check,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { useDialog } from "@/components/ui/CustomDialog";

interface PostItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  date: string;
  views: number;
  comments: number;
  featuredImageUrl?: string | null;
}

interface DraftItem {
  id: string;
  title: string;
  timeAgo: string;
  category: string;
}

interface CommentItem {
  id: string;
  authorName: string;
  postTitle: string;
  content: string;
  timeAgo: string;
}

interface AdminDashboardClientProps {
  stats: {
    totalViews: number;
    publishedPosts: number;
    commentsCount: number;
    subscribersCount: number;
  };
  posts: PostItem[];
  drafts: DraftItem[];
  comments: CommentItem[];
}

export default function AdminDashboardClient({
  stats,
  posts: initialPosts,
  drafts: initialDrafts,
  comments: initialComments,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const dialog = useDialog();

  // State
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [drafts, setDrafts] = useState<DraftItem[]>(initialDrafts);
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [activeRange, setActiveRange] = useState<"7d" | "30d" | "90d">("30d");
  const [activeMetrics, setActiveMetrics] = useState({
    pageViews: true,
    visitors: true,
    avgTime: true,
  });

  // Action Menu dropdown state
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  // AI Writer Modal state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCategory, setAiCategory] = useState("AI Tools");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null);

  // Toggle selection
  function toggleSelectAll() {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map((p) => p.id));
    }
  }

  function toggleSelectPost(id: string) {
    setSelectedPosts((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  // Delete post
  async function handleDeletePost(id: string) {
    const ok = await dialog.dangerConfirm(
      "Apakah Anda yakin ingin menghapus artikel ini? Tindakan ini tidak dapat dibatalkan.",
      "Hapus Artikel"
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        setSelectedPosts((prev) => prev.filter((item) => item !== id));
        dialog.success("Artikel berhasil dihapus permanen.", "Terhapus");
        router.refresh();
      } else {
        dialog.error("Gagal menghapus artikel.", "Gagal");
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
      dialog.error("Terjadi kesalahan jaringan saat menghapus artikel.", "Gagal");
    }
  }

  // Bulk delete selected posts
  async function handleBulkDelete() {
    const ok = await dialog.dangerConfirm(
      `Apakah Anda yakin ingin menghapus ${selectedPosts.length} artikel terpilih sekaligus?`,
      "Hapus Banyak Artikel"
    );
    if (!ok) return;

    for (const id of selectedPosts) {
      await fetch(`/api/admin/posts/${id}`, { method: "DELETE" }).catch(() => {});
    }
    setPosts((prev) => prev.filter((p) => !selectedPosts.includes(p.id)));
    setSelectedPosts([]);
    dialog.success(`${selectedPosts.length} artikel berhasil dihapus.`, "Berhasil");
    router.refresh();
  }

  // Approve or delete comment
  async function handleCommentAction(id: string, action: "approve" | "delete") {
    try {
      if (action === "delete") {
        await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
        setComments((prev) => prev.filter((c) => c.id !== id));
      } else {
        await fetch(`/api/admin/comments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "approved" }),
        });
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, approved: true } : c))
        );
      }
      router.refresh();
    } catch (err) {
      console.error("Comment action failed:", err);
    }
  }

  // Generate article with AI
  async function handleGenerateWithAi(e: React.FormEvent) {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/ai-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, category: aiCategory }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setAiGeneratedData(data.data);
      }
    } catch (err) {
      console.error("AI write error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  // Save generated AI article directly as Draft
  async function handleSaveAiDraft() {
    if (!aiGeneratedData) return;
    try {
      setAiLoading(true);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (process.env.NEXT_PUBLIC_CMS_API_KEY) {
        headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_CMS_API_KEY}`;
      }

      const res = await fetch("/api/v1/posts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: aiGeneratedData.title,
          slug: aiGeneratedData.slug,
          contentHtml: aiGeneratedData.contentHtml,
          excerpt: aiGeneratedData.excerpt,
          metaDescription: aiGeneratedData.metaDescription,
          tags: aiGeneratedData.tags,
          faqJson: aiGeneratedData.faq,
          status: "draft",
        }),
      });

      if (res.ok) {
        setAiModalOpen(false);
        setAiGeneratedData(null);
        setAiTopic("");
        router.push("/admin/posts");
        router.refresh();
      }
    } catch (err) {
      console.error("Save AI draft error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header with Greeting and Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Dashboard
          </span>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-[#101313] tracking-tight">
            Welcome back, Adit! 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            Here&apos;s what&apos;s happening with your StackYup site today.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-[#E6EBE8] shadow-2xs text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveRange("7d")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeRange === "7d" ? "bg-[#EAF8F0] text-[#079653]" : "text-[#667085] hover:text-[#101313]"
            }`}
          >
            Last 7 days
          </button>
          <button
            type="button"
            onClick={() => setActiveRange("30d")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeRange === "30d" ? "bg-[#EAF8F0] text-[#079653]" : "text-[#667085] hover:text-[#101313]"
            }`}
          >
            Last 30 days
          </button>
          <button
            type="button"
            onClick={() => setActiveRange("90d")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeRange === "90d" ? "bg-[#EAF8F0] text-[#079653]" : "text-[#667085] hover:text-[#101313]"
            }`}
          >
            Last 90 days
          </button>
        </div>
      </div>

      {/* 2. Four KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Page Views */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#EAF8F0] text-[#079653] flex items-center justify-center">
              <Eye className="w-4.5 h-4.5" />
            </div>
            <svg className="w-20 h-8 text-[#079653]" viewBox="0 0 80 32" fill="none">
              <path
                d="M2 24 C14 26, 20 8, 30 18 C40 26, 48 4, 60 14 C68 22, 74 10, 78 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <span className="text-xs font-medium text-[#667085] block">Total Page Views</span>
            <span className="text-2xl font-extrabold text-[#101313] tracking-tight block mt-0.5">
              {stats.totalViews.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px]">
            <span className="font-bold text-[#079653] flex items-center gap-0.5">
              <span>↑</span> 12.5%
            </span>
            <span className="text-[#8a9099]">vs. previous 30 days</span>
          </div>
        </div>

        {/* KPI 2: Published Posts */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#EAF8F0] text-[#079653] flex items-center justify-center">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <svg className="w-20 h-8 text-[#079653]" viewBox="0 0 80 32" fill="none">
              <path
                d="M2 20 C15 22, 22 10, 32 16 C42 22, 50 6, 62 12 C70 18, 75 8, 78 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <span className="text-xs font-medium text-[#667085] block">Published Posts</span>
            <span className="text-2xl font-extrabold text-[#101313] tracking-tight block mt-0.5">
              {stats.publishedPosts}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px]">
            <span className="font-bold text-[#079653] flex items-center gap-0.5">
              <span>↑</span> 7.7%
            </span>
            <span className="text-[#8a9099]">vs. previous 30 days</span>
          </div>
        </div>

        {/* KPI 3: Comments */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center">
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <svg className="w-20 h-8 text-[#9333EA]" viewBox="0 0 80 32" fill="none">
              <path
                d="M2 26 C12 28, 20 12, 32 20 C44 28, 52 8, 64 16 C72 22, 76 10, 78 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <span className="text-xs font-medium text-[#667085] block">Comments</span>
            <span className="text-2xl font-extrabold text-[#101313] tracking-tight block mt-0.5">
              {stats.commentsCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px]">
            <span className="font-bold text-[#079653] flex items-center gap-0.5">
              <span>↑</span> 18.1%
            </span>
            <span className="text-[#8a9099]">vs. previous 30 days</span>
          </div>
        </div>

        {/* KPI 4: Newsletter Subscribers */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#EAF8F0] text-[#079653] flex items-center justify-center">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <svg className="w-20 h-8 text-[#EA580C]" viewBox="0 0 80 32" fill="none">
              <path
                d="M2 24 C14 26, 24 16, 34 22 C46 28, 54 6, 64 16 C72 24, 76 14, 78 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <span className="text-xs font-medium text-[#667085] block">Newsletter Subscribers</span>
            <span className="text-2xl font-extrabold text-[#101313] tracking-tight block mt-0.5">
              {stats.subscribersCount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px]">
            <span className="font-bold text-[#079653] flex items-center gap-0.5">
              <span>↑</span> 22.3%
            </span>
            <span className="text-[#8a9099]">vs. previous 30 days</span>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Body: 2-Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Traffic Chart & Recent Posts */}
        <div className="xl:col-span-8 space-y-6">
          {/* Traffic Overview Chart */}
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-base text-[#101313] tracking-tight">
                Traffic Overview
              </h3>

              <div className="text-xs text-[#667085] font-medium">
                Period: <span className="text-[#101313] font-bold capitalize">{activeRange}</span>
              </div>
            </div>

            {/* Metric Legend Toggles */}
            <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
              <button
                type="button"
                onClick={() =>
                  setActiveMetrics((prev) => ({ ...prev, pageViews: !prev.pageViews }))
                }
                className="flex items-center gap-2 cursor-pointer"
              >
                <span
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white text-[9px] font-bold ${
                    activeMetrics.pageViews ? "bg-[#079653]" : "bg-gray-300"
                  }`}
                >
                  {activeMetrics.pageViews && "✓"}
                </span>
                <span className="text-[#667085]">Page Views</span>
                <span className="font-bold text-[#101313]">
                  {stats.totalViews.toLocaleString()}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveMetrics((prev) => ({ ...prev, visitors: !prev.visitors }))
                }
                className="flex items-center gap-2 cursor-pointer"
              >
                <span
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white text-[9px] font-bold ${
                    activeMetrics.visitors ? "bg-[#2563EB]" : "bg-gray-300"
                  }`}
                >
                  {activeMetrics.visitors && "✓"}
                </span>
                <span className="text-[#667085]">Unique Visitors</span>
                <span className="font-bold text-[#101313]">
                  {Math.round(stats.totalViews * 0.41).toLocaleString()}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveMetrics((prev) => ({ ...prev, avgTime: !prev.avgTime }))
                }
                className="flex items-center gap-2 cursor-pointer"
              >
                <span
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white text-[9px] font-bold ${
                    activeMetrics.avgTime ? "bg-[#9333EA]" : "bg-gray-300"
                  }`}
                >
                  {activeMetrics.avgTime && "✓"}
                </span>
                <span className="text-[#667085]">Avg. Time on Page</span>
                <span className="font-bold text-[#101313]">2m 34s</span>
              </button>
            </div>

            {/* Interactive SVG Chart */}
            <div className="relative w-full h-[220px] pt-3">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 760 180"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#079653" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#079653" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="0" y1="170" x2="760" y2="170" stroke="#F0F3F1" strokeWidth="1" />
                <line x1="0" y1="125" x2="760" y2="125" stroke="#F0F3F1" strokeWidth="1" />
                <line x1="0" y1="80" x2="760" y2="80" stroke="#F0F3F1" strokeWidth="1" />
                <line x1="0" y1="35" x2="760" y2="35" stroke="#F0F3F1" strokeWidth="1" />

                {/* Line 1: Page Views (Green) */}
                {activeMetrics.pageViews && (
                  <>
                    <path
                      d="M 10 130 C 60 100, 110 135, 170 120 C 230 105, 280 60, 340 50 C 400 95, 450 65, 510 60 C 570 70, 620 40, 680 50 L 750 42 L 750 170 L 10 170 Z"
                      fill="url(#gradientGreen)"
                    />
                    <path
                      d="M 10 130 C 60 100, 110 135, 170 120 C 230 105, 280 60, 340 50 C 400 95, 450 65, 510 60 C 570 70, 620 40, 680 50 L 750 42"
                      fill="none"
                      stroke="#079653"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Line 2: Unique Visitors (Blue) */}
                {activeMetrics.visitors && (
                  <path
                    d="M 10 148 C 60 132, 110 152, 170 142 C 230 135, 280 110, 340 100 C 400 125, 450 115, 510 110 C 570 115, 620 100, 680 105 L 750 102"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* Line 3: Avg Time on Page (Purple) */}
                {activeMetrics.avgTime && (
                  <path
                    d="M 10 162 C 60 155, 110 162, 170 158 C 230 150, 280 138, 340 135 C 400 145, 450 135, 510 130 C 570 140, 620 128, 680 132 L 750 128"
                    fill="none"
                    stroke="#9333EA"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                )}
              </svg>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[10px] text-[#8a9099] pt-2 font-medium">
                <span>Day 1</span>
                <span>Day 6</span>
                <span>Day 12</span>
                <span>Day 18</span>
                <span>Day 24</span>
                <span>Day 30</span>
              </div>
            </div>
          </div>

          {/* Recent Posts Table */}
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-base text-[#101313] tracking-tight">
                  Recent Posts
                </h3>
                {selectedPosts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#079653] font-bold">
                      {selectedPosts.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>

              <Link
                href="/admin/posts"
                className="text-xs font-bold text-[#101313] hover:text-[#079653] flex items-center gap-1 transition"
              >
                <span>View all posts</span>
                <span>→</span>
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E6EBE8] text-[11px] font-bold uppercase tracking-wider text-[#667085] bg-[#FAFCFB]">
                    <th className="py-2.5 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedPosts.length === posts.length && posts.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-[#E6EBE8] text-[#079653] focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Views</th>
                    <th className="py-2.5 px-3 text-center">Comments</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E6EBE8]">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[#8a9099] italic">
                        No articles published or drafted yet. Click &quot;+ Write Article&quot; to create your first story!
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                    <tr
                      key={post.id}
                      className={`hover:bg-[#F8FAF9] transition ${
                        selectedPosts.includes(post.id) ? "bg-[#EAF8F0]/30" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={selectedPosts.includes(post.id)}
                          onChange={() => toggleSelectPost(post.id)}
                          className="rounded border-[#E6EBE8] text-[#079653] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Thumbnail & Title */}
                      <td className="py-3 px-3 max-w-[280px]">
                        <div className="flex items-center gap-2.5">
                          {post.featuredImageUrl ? (
                            <img
                              src={post.featuredImageUrl}
                              alt=""
                              className="w-10 h-7 object-cover rounded-lg bg-gray-100 shrink-0 border border-[#E6EBE8]"
                            />
                          ) : (
                            <div className="w-10 h-7 rounded-lg bg-[#EAF8F0] text-[#079653] flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="font-semibold text-xs text-[#101313] hover:text-[#079653] transition truncate block"
                            title={post.title}
                          >
                            {post.title}
                          </Link>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
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

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F4F6F5] text-[#4b5563] border border-[#E6EBE8] font-medium">
                          {post.category}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-xs text-[#667085] whitespace-nowrap">
                        {post.date}
                      </td>

                      {/* Views */}
                      <td className="py-3 px-3 text-xs text-center font-semibold text-[#101313]">
                        {post.views}
                      </td>

                      {/* Comments */}
                      <td className="py-3 px-3 text-xs text-center text-[#667085]">
                        {post.comments}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="p-1.5 rounded-lg text-[#667085] hover:text-[#079653] hover:bg-[#EAF8F0] transition"
                            title="Edit Post"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            href={`/${post.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-[#667085] hover:text-[#079653] hover:bg-[#EAF8F0] transition"
                            title="View Live"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 rounded-lg text-[#667085] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Actions, Drafts, Latest Comments */}
        <div className="xl:col-span-4 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-5 shadow-2xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a9099] block mb-2">
              Quick Actions
            </span>

            {/* 1. Primary CTA: Create New Post */}
            <Link
              href="/admin/posts/new"
              className="w-full h-10 px-4 rounded-xl bg-[#079653] hover:bg-[#068046] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Post</span>
            </Link>

            {/* 2. Write with AI */}
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="w-full h-9 px-4 rounded-xl border border-[#E6EBE8] hover:bg-[#F8FAF9] text-[#101313] text-xs font-medium flex items-center gap-2.5 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#079653]" />
              <span>Write with AI</span>
            </button>

            {/* 3. Upload Media */}
            <Link
              href="/admin/media"
              className="w-full h-9 px-4 rounded-xl border border-[#E6EBE8] hover:bg-[#F8FAF9] text-[#101313] text-xs font-medium flex items-center gap-2.5 transition"
            >
              <Camera className="w-4 h-4 text-[#079653]" />
              <span>Upload Media</span>
            </Link>

            {/* 4. Manage Categories */}
            <Link
              href="/admin/categories"
              className="w-full h-9 px-4 rounded-xl border border-[#E6EBE8] hover:bg-[#F8FAF9] text-[#101313] text-xs font-medium flex items-center gap-2.5 transition"
            >
              <FolderTree className="w-4 h-4 text-[#079653]" />
              <span>Manage Categories</span>
            </Link>

            {/* 5. View Site */}
            <Link
              href="/"
              target="_blank"
              className="w-full h-9 px-4 rounded-xl border border-[#E6EBE8] hover:bg-[#F8FAF9] text-[#101313] text-xs font-medium flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4 text-[#079653]" />
                <span>View Site</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-[#8a9099]" />
            </Link>
          </div>

          {/* Drafts Card */}
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a9099]">
                Drafts
              </span>
              <Link
                href="/admin/posts?status=draft"
                className="text-[11px] font-bold text-[#101313] hover:text-[#079653] flex items-center gap-1"
              >
                <span>View all</span>
                <span>→</span>
              </Link>
            </div>

            {drafts.length === 0 ? (
              <p className="text-xs text-[#8a9099] italic py-2">No drafts found. All posts are published!</p>
            ) : (
              <div className="space-y-3">
                {drafts.map((draft) => (
                  <div key={draft.id} className="flex items-start justify-between gap-3 group">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/posts/${draft.id}/edit`}
                        className="font-bold text-xs text-[#101313] group-hover:text-[#079653] transition block truncate"
                        title={draft.title}
                      >
                        {draft.title}
                      </Link>
                      <span className="text-[11px] text-[#8a9099] block mt-0.5">
                        {draft.timeAgo}
                      </span>
                    </div>

                    <Link
                      href={`/admin/posts/${draft.id}/edit`}
                      className="px-2.5 py-1 rounded-lg border border-[#E6EBE8] hover:border-[#079653] text-[11px] font-semibold text-[#079653] hover:bg-[#EAF8F0] transition shrink-0"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest Comments Card */}
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a9099]">
                Latest Comments
              </span>
              <Link
                href="/admin/comments"
                className="text-[11px] font-bold text-[#101313] hover:text-[#079653] flex items-center gap-1"
              >
                <span>View all</span>
                <span>→</span>
              </Link>
            </div>

            {comments.length === 0 ? (
              <p className="text-xs text-[#8a9099] italic py-2">No comments yet.</p>
            ) : (
              <div className="space-y-3.5">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2.5">
                    {/* User Avatar Initial */}
                    <div className="w-7 h-7 rounded-full bg-[#101313] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {comment.authorName[0]}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-[#101313]">
                          {comment.authorName}
                        </span>
                        <span className="text-[10px] text-[#8a9099]">
                          {comment.timeAgo}
                        </span>
                      </div>
                      <p className="text-xs text-[#4b5563] line-clamp-2 mt-0.5">
                        {comment.content}
                      </p>
                      <span className="text-[11px] text-[#079653] font-medium truncate block mt-0.5">
                        on {comment.postTitle}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCommentAction(comment.id, "delete")}
                      className="text-[#8a9099] hover:text-rose-600 transition cursor-pointer shrink-0 mt-1"
                      title="Delete Comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Writer Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] shadow-2xl max-w-lg w-full p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-[#E6EBE8] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EAF8F0] text-[#079653] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#101313]">Write with AI</h3>
                  <p className="text-xs text-[#667085]">Generate an optimized editorial draft in seconds</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="text-[#8a9099] hover:text-[#101313] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!aiGeneratedData ? (
              <form onSubmit={handleGenerateWithAi} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1.5">
                    Topic / Headline Prompt *
                  </label>
                  <input
                    type="text"
                    required
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. 5 Best AI Code Assistants for Solo Founders"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1.5">
                    Target Category
                  </label>
                  <select
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                  >
                    <option value="AI Tools">AI Tools</option>
                    <option value="Comparisons">Comparisons</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Tech">Tech</option>
                    <option value="Freelancers">Freelancers</option>
                    <option value="Reviews">Reviews</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={aiLoading}
                  className="w-full py-2.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Drafting with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Article Draft</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] space-y-1">
                  <span className="text-[11px] font-bold text-[#079653] uppercase">Draft Created Successfully</span>
                  <h4 className="font-bold text-sm text-[#101313]">{aiGeneratedData.title}</h4>
                  <p className="text-xs text-[#4b5563] line-clamp-2">{aiGeneratedData.excerpt}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAiDraft}
                    disabled={aiLoading}
                    className="flex-1 py-2.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save as Draft Post</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiGeneratedData(null)}
                    className="px-4 py-2.5 rounded-xl border border-[#E6EBE8] text-xs font-semibold text-[#667085] hover:bg-[#F8FAF9] cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
