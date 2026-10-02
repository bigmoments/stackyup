"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Check,
  Trash2,
  ShieldAlert,
  Clock,
  ArrowRight,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Plus,
  RotateCcw,
  CheckCircle2,
  X,
  AlertCircle,
  Archive,
} from "lucide-react";
import Link from "next/link";

export interface CommentItem {
  id: string;
  postId: string;
  postTitle: string | null;
  postSlug: string | null;
  authorName: string;
  authorEmail: string | null;
  content: string;
  status: string;
  createdAt: string;
}

interface CommentsClientProps {
  initialComments: CommentItem[];
}

export default function CommentsClient({ initialComments }: CommentsClientProps) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // New Comment Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPostId, setNewPostId] = useState("");
  const [newAuthorName, setNewAuthorName] = useState("StackYup Editorial");
  const [newAuthorEmail, setNewAuthorEmail] = useState("team@stackyup.com");
  const [newContent, setNewContent] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  function notify(type: "success" | "error", message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }

  // Filter comments based on tab and search
  const filtered = comments.filter((c) => {
    const matchesTab = activeTab === "all" || c.status === activeTab;
    if (!matchesTab) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.authorName.toLowerCase().includes(q) ||
      (c.authorEmail && c.authorEmail.toLowerCase().includes(q)) ||
      c.content.toLowerCase().includes(q) ||
      (c.postTitle && c.postTitle.toLowerCase().includes(q))
    );
  });

  async function handleStatus(id: string, newStatus: string) {
    setIsProcessing(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
      notify("success", `Comment moved to ${newStatus}`);
      router.refresh();
    } catch (err: any) {
      notify("error", err?.message || "Failed to update comment");
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this comment? This cannot be undone.")) return;
    setIsProcessing(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete comment");

      setComments((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      notify("success", "Comment permanently deleted");
      router.refresh();
    } catch (err: any) {
      notify("error", err?.message || "Failed to delete comment");
    } finally {
      setIsProcessing(null);
    }
  }

  // Bulk actions
  async function handleBulkStatus(newStatus: string) {
    if (selectedIds.length === 0) return;
    try {
      for (const id of selectedIds) {
        await fetch(`/api/admin/comments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      }
      setComments((prev) =>
        prev.map((c) => (selectedIds.includes(c.id) ? { ...c, status: newStatus } : c))
      );
      notify("success", `Updated ${selectedIds.length} comments to ${newStatus}`);
      setSelectedIds([]);
      router.refresh();
    } catch (err: any) {
      notify("error", "Failed to update selected comments");
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.length} comments?`)) return;
    try {
      for (const id of selectedIds) {
        await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
      }
      setComments((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      notify("success", `Deleted ${selectedIds.length} comments`);
      setSelectedIds([]);
      router.refresh();
    } catch (err: any) {
      notify("error", "Failed to delete selected comments");
    }
  }

  function toggleSelectAll() {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c.id));
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleCreateComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newPostId.trim() || !newContent.trim()) {
      notify("error", "Target Post ID / Slug and Comment content are required");
      return;
    }

    setIsSubmittingNew(true);
    try {
      const res = await fetch(`/api/v1/posts/${encodeURIComponent(newPostId.trim())}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: newAuthorName.trim() || "StackYup Editorial",
          authorEmail: newAuthorEmail.trim() || null,
          content: newContent.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to post comment");

      const created = json.data;
      setComments((prev) => [
        {
          id: created.id,
          postId: created.postId,
          postTitle: created.postTitle || "StackYup Article",
          postSlug: newPostId.trim(),
          authorName: created.authorName,
          authorEmail: created.authorEmail || null,
          content: created.content,
          status: created.status || "approved",
          createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString(),
        },
        ...prev,
      ]);

      notify("success", "Editorial response successfully posted!");
      setShowAddModal(false);
      setNewContent("");
      setNewPostId("");
      router.refresh();
    } catch (err: any) {
      notify("error", err?.message || "Failed to add comment");
    } finally {
      setIsSubmittingNew(false);
    }
  }

  const tabs = [
    { label: "All Comments", key: "all" },
    { label: "Approved", key: "approved" },
    { label: "Pending", key: "pending" },
    { label: "Spam", key: "spam" },
    { label: "Trash", key: "trash" },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${
            notification.type === "success"
              ? "bg-[#EAF8F0] border-[#a4e2bf] text-[#079653]"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Audience Engagement
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
            Comments Moderation
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Review, approve, spam-filter, and moderate feedback submitted across all articles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#079653] hover:bg-[#067a43] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Response</span>
        </button>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === "all"
                ? comments.length
                : comments.filter((c) => c.status === tab.key).length;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedIds([]);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#EAF8F0] text-[#079653]"
                    : "text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-[#079653] text-white" : "bg-[#F0F3F1] text-[#667085]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9099]" />
          <input
            type="text"
            placeholder="Search author, content, article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E6EBE8] rounded-xl text-xs text-[#101313] placeholder:text-[#8a9099] focus:outline-none focus:border-[#079653] transition shadow-2xs"
          />
        </div>
      </div>

      {/* Bulk Action Bar (Visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-[#f8faf9] border border-[#E6EBE8] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#101313]">{selectedIds.length} selected</span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-[#667085] hover:underline"
            >
              Deselect all
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkStatus("approved")}
              className="px-2.5 py-1 bg-[#EAF8F0] hover:bg-[#d4f2e0] text-[#079653] rounded-lg font-semibold transition"
            >
              Approve Selected
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatus("spam")}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold transition"
            >
              Mark Spam
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatus("trash")}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold transition"
            >
              Move to Trash
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold transition"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="bg-white rounded-2xl border border-[#E6EBE8] overflow-hidden shadow-2xs">
        {/* Table header with Select All */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-b border-[#E6EBE8] bg-[#F8FAF9] flex items-center justify-between text-xs text-[#667085]">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.length === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-[#E6EBE8] text-[#079653] focus:ring-[#079653] cursor-pointer"
              />
              <span className="font-semibold text-[#101313]">Select All ({filtered.length})</span>
            </div>
            <span>Showing {filtered.length} responses</span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-10 h-10 text-[#8a9099] mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-[#101313]">No comments found</h3>
            <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
              There are no comments matching your current filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6EBE8]">
            {filtered.map((comment) => {
              const isSelected = selectedIds.includes(comment.id);
              const isBusy = isProcessing === comment.id;

              return (
                <div
                  key={comment.id}
                  className={`p-5 hover:bg-[#F8FAF9] transition flex flex-col lg:flex-row items-start justify-between gap-4 ${
                    isSelected ? "bg-[#F4FBF7]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(comment.id)}
                      className="mt-1 rounded border-[#E6EBE8] text-[#079653] focus:ring-[#079653] cursor-pointer"
                    />

                    <div className="w-8 h-8 rounded-full bg-[#101313] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {(comment.authorName || "R").charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-[#101313]">
                          {comment.authorName}
                        </span>
                        {comment.authorEmail && (
                          <span className="text-[11px] text-[#8a9099]">
                            ({comment.authorEmail})
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            comment.status === "approved"
                              ? "bg-[#EAF8F0] text-[#079653]"
                              : comment.status === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : comment.status === "spam"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {comment.status}
                        </span>
                      </div>

                      <p className="text-xs text-[#242424] leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#8a9099]">
                        <span>On article:</span>
                        {comment.postSlug ? (
                          <Link
                            href={`/${comment.postSlug}`}
                            target="_blank"
                            className="font-semibold text-[#101313] hover:text-[#079653] hover:underline truncate inline-flex items-center gap-1"
                          >
                            <span>{comment.postTitle || "StackYup Article"}</span>
                            <ExternalLink className="w-3 h-3 text-[#079653]" />
                          </Link>
                        ) : (
                          <span className="font-semibold text-[#101313] truncate">
                            {comment.postTitle || "StackYup Article"}
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Moderation Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 self-end lg:self-center shrink-0">
                    {/* If Not Approved: Approve button */}
                    {comment.status !== "approved" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatus(comment.id, "approved")}
                        className="px-2.5 py-1.5 rounded-lg bg-[#EAF8F0] hover:bg-[#d4f2e0] text-[#079653] font-semibold text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Approve Comment"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {/* If Approved: Allow Unapprove/Pending */}
                    {comment.status === "approved" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatus(comment.id, "pending")}
                        className="px-2 py-1.5 rounded-lg text-[#667085] hover:text-amber-700 hover:bg-amber-50 font-medium text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Set to Pending"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </button>
                    )}

                    {/* Spam button */}
                    {comment.status !== "spam" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatus(comment.id, "spam")}
                        className="p-1.5 rounded-lg text-[#667085] hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer disabled:opacity-50"
                        title="Mark as Spam"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}

                    {/* Trash button */}
                    {comment.status !== "trash" ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatus(comment.id, "trash")}
                        className="p-1.5 rounded-lg text-[#667085] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                        title="Move to Trash"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    ) : (
                      /* Restore from Trash */
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatus(comment.id, "approved")}
                        className="px-2 py-1.5 rounded-lg text-[#079653] bg-[#EAF8F0] hover:bg-[#d4f2e0] font-semibold text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Restore Comment"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    )}

                    {/* Hard Delete button */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(comment.id)}
                      className="p-1.5 rounded-lg text-[#667085] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                      title="Permanently Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Comment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E6EBE8] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#079653]" />
                <h3 className="font-extrabold text-lg text-[#101313]">Post Editorial Response</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#8a9099] hover:text-[#101313] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#101313] mb-1">
                  Target Article (ID or Slug) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7-best-ai-tools-for-freelancers-in-2026 or p_..."
                  value={newPostId}
                  onChange={(e) => setNewPostId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E6EBE8] rounded-xl text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#101313] mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={newAuthorName}
                    onChange={(e) => setNewAuthorName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E6EBE8] rounded-xl text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101313] mb-1">
                    Author Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={newAuthorEmail}
                    onChange={(e) => setNewAuthorEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E6EBE8] rounded-xl text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101313] mb-1">
                  Comment Content *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write the official editorial response or feedback..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-3 bg-white border border-[#E6EBE8] rounded-xl text-xs text-[#101313] focus:outline-none focus:border-[#079653] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6EBE8]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-[#667085] hover:text-[#101313] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-5 py-2.5 rounded-xl bg-[#079653] hover:bg-[#067a43] disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {isSubmittingNew ? "Posting..." : "Publish Response"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
