"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Check,
  Star,
  Globe,
  UserCheck,
  X,
} from "lucide-react";
import { useDialog } from "@/components/ui/CustomDialog";

export interface AuthorItem {
  id: string;
  name: string;
  slug: string;
  role: string | null;
  bio: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  twitterHandle: string | null;
  isDefault: boolean;
  articleCount: number;
  createdAt: Date;
}

interface AuthorsClientProps {
  initialAuthors: AuthorItem[];
  defaultAuthorSetting: string;
}

export default function AuthorsClient({
  initialAuthors,
  defaultAuthorSetting,
}: AuthorsClientProps) {
  const router = useRouter();
  const [authors, setAuthors] = useState<AuthorItem[]>(initialAuthors);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form inputs
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setRole("");
    setBio("");
    setAvatarUrl("");
    setWebsiteUrl("");
    setTwitterHandle("");
    setIsDefault(false);
  }

  function handleNameChange(val: string) {
    setName(val);
    if (!editingId) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
    }
  }

  function handleStartEdit(author: AuthorItem) {
    setEditingId(author.id);
    setName(author.name);
    setSlug(author.slug);
    setRole(author.role || "");
    setBio(author.bio || "");
    setAvatarUrl(author.avatarUrl || "");
    setWebsiteUrl(author.websiteUrl || "");
    setTwitterHandle(author.twitterHandle || "");
    setIsDefault(author.isDefault);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Author name is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      role: role.trim() || null,
      bio: bio.trim() || null,
      avatarUrl: avatarUrl.trim() || null,
      websiteUrl: websiteUrl.trim() || null,
      twitterHandle: twitterHandle.trim() || null,
      isDefault,
    };

    try {
      if (editingId) {
        // Update
        const res = await fetch("/api/admin/authors", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to update author");

        setAuthors((prev) =>
          prev.map((a) => {
            if (a.id === editingId) {
              return {
                ...a,
                ...payload,
              };
            }
            if (isDefault) {
              return { ...a, isDefault: false };
            }
            return a;
          })
        );
        setSuccess(`Author "${name}" updated successfully.`);
      } else {
        // Create
        const res = await fetch("/api/admin/authors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to create author");

        const newAuthor: AuthorItem = {
          id: data.data.id,
          ...payload,
          articleCount: 0,
          createdAt: new Date(),
        };

        setAuthors((prev) => [
          ...prev.map((a) => (isDefault ? { ...a, isDefault: false } : a)),
          newAuthor,
        ]);
        setSuccess(`Author "${name}" created successfully.`);
      }

      resetForm();
      setTimeout(() => setSuccess(null), 3500);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save author");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetAsDefault(author: AuthorItem) {
    if (author.isDefault) return;
    try {
      const res = await fetch("/api/admin/authors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: author.id,
          name: author.name,
          slug: author.slug,
          role: author.role,
          bio: author.bio,
          avatarUrl: author.avatarUrl,
          websiteUrl: author.websiteUrl,
          twitterHandle: author.twitterHandle,
          isDefault: true,
        }),
      });

      if (res.ok) {
        setAuthors((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === author.id,
          }))
        );
        setSuccess(`"${author.name}" set as the default author persona.`);
        setTimeout(() => setSuccess(null), 3000);
        router.refresh();
      }
    } catch (err) {
      console.error("Set default author error:", err);
    }
  }

  const dialog = useDialog();

  async function handleDelete(author: AuthorItem) {
    if (author.isDefault) {
      dialog.error(
        "Tidak Dapat Menghapus",
        "Penulis ini ditetapkan sebagai persona default. Tetapkan penulis default lainnya terlebih dahulu sebelum menghapus ini."
      );
      return;
    }

    const ok = await dialog.dangerConfirm(
      `Hapus Persona Penulis "${author.name}"?`,
      "Profil penulis ini akan dihapus secara permanen. Artikel yang terkait akan dialihkan ke persona default.",
      "Ya, Hapus Penulis"
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/authors?id=${author.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        dialog.error("Gagal Menghapus", data.error?.message || "Terjadi kesalahan saat menghapus penulis.");
        return;
      }

      setAuthors((prev) => prev.filter((a) => a.id !== author.id));
      setSuccess(`Author "${author.name}" removed.`);
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch (err: any) {
      dialog.error("Gagal Menghapus", err.message || "Gagal menghubungi server.");
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
          Editorial Team
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
          Authors &amp; Personas ({authors.length})
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Manage writers, assign roles, and configure the primary default author for new articles and AI publishers.
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Column: Add / Edit Author */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
            <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit2 className="w-4 h-4 text-[#079653]" />
                  <span>Edit Author</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-[#079653]" />
                  <span>Add New Author</span>
                </>
              )}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-[#667085] hover:text-[#101313] flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Edit</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">
                Full Name / Pen Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Adit, Sarah Jenkins"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">
                Slug (URL identifier)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. adit"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">
                Role / Title
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Founder &amp; Tech Writer, Senior AI Reviewer"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">
                Bio / About Snippet
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Short bio displayed on author boxes and schema metadata..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://... (Cloudinary or Gravatar)"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">
                  Twitter / X
                </label>
                <input
                  type="text"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  placeholder="@handle"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                />
              </div>
            </div>

            {/* Set as Default Switch */}
            <div className="p-3 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8]">
              <label className="flex items-center gap-2.5 text-xs text-[#101313] font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-[#079653] rounded border-gray-300 focus:ring-0 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Set as Default Author for Blog</span>
                </span>
              </label>
              <p className="text-[11px] text-[#667085] mt-1 pl-6">
                When checked, articles without an explicit author and new drafts will automatically use this persona.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{loading ? "Saving..." : editingId ? "Save Changes" : "Create Author"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* List Column: Existing Authors */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] overflow-hidden shadow-2xs">
            <div className="px-6 py-4 border-b border-[#E6EBE8] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#101313]">Registered Authors</h3>
              <span className="text-xs text-[#667085]">
                Default Fallback: <strong className="text-[#079653]">{defaultAuthorSetting || "Adit"}</strong>
              </span>
            </div>

            {authors.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#667085]">
                No authors registered yet. Create your first author persona on the left.
              </div>
            ) : (
              <div className="divide-y divide-[#E6EBE8]">
                {authors.map((author) => (
                  <div
                    key={author.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8FAF9]/60 transition"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Avatar preview */}
                      <div className="w-11 h-11 rounded-full bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] flex items-center justify-center font-bold text-base shrink-0 overflow-hidden">
                        {author.avatarUrl ? (
                          <img
                            src={author.avatarUrl}
                            alt={author.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          author.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-[#101313]">{author.name}</h4>
                          {author.isDefault && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-[10px] font-bold">
                              <Star className="w-3 h-3 fill-[#079653]" />
                              <span>DEFAULT</span>
                            </span>
                          )}
                        </div>

                        {author.role && (
                          <p className="text-xs text-[#667085] font-medium">{author.role}</p>
                        )}

                        {author.bio && (
                          <p className="text-xs text-[#8a9099] line-clamp-2 max-w-lg">
                            {author.bio}
                          </p>
                        )}

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-[#667085]">
                          <span className="font-mono text-[#8a9099]">/{author.slug}</span>
                          {author.websiteUrl && (
                            <a
                              href={author.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-[#079653] flex items-center gap-1"
                            >
                              <Globe className="w-3 h-3" />
                              <span>Site</span>
                            </a>
                          )}
                          {author.twitterHandle && (
                            <span className="flex items-center gap-1 text-[#8a9099]">
                              <span className="font-semibold text-[10px]">𝕏</span>
                              <span>{author.twitterHandle}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {!author.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetAsDefault(author)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#E6EBE8] bg-[#F8FAF9] hover:bg-[#EAF8F0] hover:border-[#079653] hover:text-[#079653] text-xs font-semibold text-[#667085] transition flex items-center gap-1 cursor-pointer"
                          title="Set as Default Author"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          <span>Set Default</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStartEdit(author)}
                        className="p-1.5 rounded-lg bg-[#F8FAF9] hover:bg-white text-[#667085] hover:text-[#079653] border border-[#E6EBE8] transition cursor-pointer"
                        title="Edit Author"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={author.isDefault}
                        onClick={() => handleDelete(author)}
                        className="p-1.5 rounded-lg bg-[#F8FAF9] hover:bg-rose-50 text-[#8a9099] hover:text-rose-600 border border-[#E6EBE8] transition cursor-pointer disabled:opacity-40 disabled:hover:bg-[#F8FAF9] disabled:hover:text-[#8a9099]"
                        title={author.isDefault ? "Cannot delete default author" : "Delete Author"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
