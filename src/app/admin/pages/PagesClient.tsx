"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Save,
} from "lucide-react";
import { useDialog } from "@/components/ui/CustomDialog";

export interface PageItem {
  id: string;
  title: string;
  slug: string;
  contentHtml: string;
  metaDescription: string | null;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function PagesClient({ initialPages }: { initialPages: PageItem[] }) {
  const router = useRouter();
  const dialog = useDialog();
  const [pages, setPages] = useState<PageItem[]>(initialPages);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageItem | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function openCreateModal() {
    setEditingPage(null);
    setTitle("");
    setSlug("");
    setContentHtml("");
    setMetaDescription("");
    setStatus("published");
    setError(null);
    setIsModalOpen(true);
  }

  function openEditModal(page: PageItem) {
    setEditingPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setContentHtml(page.contentHtml);
    setMetaDescription(page.metaDescription || "");
    setStatus((page.status as "published" | "draft") || "published");
    setError(null);
    setIsModalOpen(true);
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!editingPage) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !contentHtml.trim()) {
      setError("Title and Page Content are required");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      content_html: contentHtml,
      meta_description: metaDescription.trim() || undefined,
      status,
    };

    try {
      if (editingPage) {
        // Edit page
        const res = await fetch(`/api/v1/pages/${editingPage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to update page");

        setPages((prev) =>
          prev.map((p) =>
            p.id === editingPage.id
              ? {
                  ...p,
                  title: data.data.title,
                  slug: data.data.slug,
                  contentHtml: data.data.content_html,
                  metaDescription: data.data.meta_description,
                  status: data.data.status,
                  updatedAt: new Date(),
                }
              : p
          )
        );
        setSuccess("Page updated successfully!");
      } else {
        // Create new page
        const res = await fetch("/api/v1/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to create page");

        const newPage: PageItem = {
          id: data.data.id,
          title: data.data.title,
          slug: data.data.slug,
          contentHtml: data.data.content_html,
          metaDescription: data.data.meta_description,
          status: data.data.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setPages((prev) => [newPage, ...prev]);
        setSuccess("Page created successfully!");
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save page");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(page: PageItem) {
    const ok = await dialog.dangerConfirm(
      `Hapus Halaman "${page.title}"?`,
      "Halaman statis ini akan dihapus secara permanen dari situs Anda. Tindakan ini tidak dapat dibatalkan.",
      "Ya, Hapus Halaman"
    );
    if (!ok) return;

    try {
      const headers: Record<string, string> = {};
      if (process.env.NEXT_PUBLIC_CMS_API_KEY) {
        headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_CMS_API_KEY}`;
      }
      const res = await fetch(`/api/v1/pages/${page.id}`, { method: "DELETE", headers });
      if (res.ok) {
        setPages((prev) => prev.filter((p) => p.id !== page.id));
        setSuccess(`Page "${page.title}" deleted.`);
        setTimeout(() => setSuccess(null), 3000);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        dialog.error("Gagal Menghapus", data.error?.message || "Gagal menghapus halaman statis.");
      }
    } catch (err: any) {
      dialog.error("Gagal Menghapus", err.message || "Gagal menghubungi server.");
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Content Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
            Static Pages ({pages.length})
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Manage institutional and legal pages (About, Contact, Privacy Policy, Terms)
          </p>
        </div>

        <Link
          href="/admin/pages/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-semibold text-xs transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Page</span>
        </Link>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Pages Table */}
      <div className="rounded-2xl bg-white border border-[#E6EBE8] overflow-hidden shadow-2xs">
        {pages.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-10 h-10 text-[#8a9099] mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-[#101313]">No static pages yet</h3>
            <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
              Create essential pages like About, Contact, or Terms of Service by clicking the button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E6EBE8] text-[11px] font-bold uppercase tracking-wider text-[#667085] bg-[#FAFCFB]">
                  <th className="py-3 px-5">Page Title</th>
                  <th className="py-3 px-5">Slug URL</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Last Updated</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EBE8]">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAF9] transition">
                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-xs text-[#101313] block">
                        {p.title}
                      </span>
                      {p.metaDescription && (
                        <p className="text-[11px] text-[#667085] line-clamp-1 mt-0.5">
                          {p.metaDescription}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-[11px] text-[#8a9099] font-mono">
                      /page/{p.slug}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          p.status === "published"
                            ? "bg-[#EAF8F0] text-[#079653]"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#667085]">
                      {new Date(p.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/page/${p.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-[#667085] hover:text-[#079653] hover:bg-[#EAF8F0] transition"
                          title="View Live"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/pages/${p.id}/edit`}
                          className="p-1.5 rounded-lg text-[#667085] hover:text-[#079653] hover:bg-[#EAF8F0] transition"
                          title="Edit Page"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="p-1.5 rounded-lg text-[#667085] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Page"
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

      {/* Create / Edit Page Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E6EBE8] flex items-center justify-between bg-[#FAFCFB]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#079653]" />
                <h3 className="font-bold text-sm text-[#101313]">
                  {editingPage ? `Edit Page: ${editingPage.title}` : "Create New Static Page"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">
                    Page Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Privacy Policy"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">
                    Slug URL *
                  </label>
                  <div className="flex items-center rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] overflow-hidden focus-within:border-[#079653]">
                    <span className="px-3 text-[11px] text-[#8a9099] bg-[#F0F3F1] select-none py-2 border-r border-[#E6EBE8]">
                      /page/
                    </span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="privacy-policy"
                      className="w-full px-3 py-2 text-xs text-[#101313] font-mono focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">
                  Meta Description (SEO)
                </label>
                <input
                  type="text"
                  maxLength={160}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Concise summary for search engine results..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">
                  Page Content (HTML / Text) *
                </label>
                <textarea
                  rows={10}
                  required
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  placeholder="<h2>Heading</h2><p>Write your page content here...</p>"
                  className="w-full p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] font-mono focus:outline-none focus:border-[#079653]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "published" | "draft")}
                  className="px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#E6EBE8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E6EBE8] text-xs font-semibold text-[#667085] hover:bg-[#F8FAF9] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? "Saving..." : editingPage ? "Update Page" : "Publish Page"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
