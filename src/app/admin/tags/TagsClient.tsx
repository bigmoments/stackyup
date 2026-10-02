"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tag as TagIcon, Plus, Trash2, AlertCircle } from "lucide-react";
import { useDialog } from "@/components/ui/CustomDialog";

interface TagItem {
  id: string;
  name: string;
  slug: string;
  articleCount: number;
}

export default function TagsClient({ initialTags }: { initialTags: TagItem[] }) {
  const router = useRouter();
  const dialog = useDialog();
  const [tags, setTags] = useState<TagItem[]>(initialTags);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create tag");

      setTags((prev) => [
        ...prev,
        { id: data.data.id, name, slug, articleCount: 0 },
      ]);
      setName("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create tag");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, tagName: string) {
    const ok = await dialog.dangerConfirm(
      `Hapus Tag #${tagName}?`,
      "Tag ini akan dihapus secara permanen dari sistem dan dilepaskan dari artikel.",
      "Ya, Hapus Tag"
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/tags?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTags((prev) => prev.filter((t) => t.id !== id));
        router.refresh();
      } else {
        const data = await res.json();
        dialog.error("Gagal Menghapus", data.error?.message || "Terjadi kesalahan saat menghapus tag.");
      }
    } catch (err: any) {
      dialog.error("Gagal Menghapus", err.message || "Gagal menghubungi server.");
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
          Content Taxonomies
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
          Tags
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Specific keywords and micro-topics attached to articles for indexing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#079653]" />
            <span>Add New Tag</span>
          </h3>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">Tag Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Claude 3.7"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? "Adding..." : "Add Tag"}</span>
            </button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E6EBE8] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E6EBE8] text-[11px] font-bold uppercase tracking-wider text-[#667085] bg-[#FAFCFB]">
                  <th className="py-3 px-5">Tag Name</th>
                  <th className="py-3 px-5">Slug</th>
                  <th className="py-3 px-5 text-center">Article Count</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EBE8]">
                {tags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-[#F8FAF9] transition">
                    <td className="py-3 px-5 font-semibold text-xs text-[#101313]">
                      #{tag.name}
                    </td>
                    <td className="py-3 px-5 text-[11px] text-[#8a9099] font-mono">
                      /{tag.slug}
                    </td>
                    <td className="py-3 px-5 text-xs text-center font-bold text-[#101313]">
                      {tag.articleCount}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(tag.id, tag.name)}
                        className="p-1.5 rounded-lg text-[#8a9099] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Tag"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
