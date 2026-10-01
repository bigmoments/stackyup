"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  CheckCircle2,
  Eye,
  Edit,
  Columns,
  Image as ImageIcon,
  Plus,
  Trash2,
  Lock,
  Unlock,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export interface PostEditorData {
  id?: string;
  title: string;
  slug: string;
  contentHtml: string;
  excerpt?: string | null;
  metaDescription?: string | null;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  tags: string[];
  faq: { question: string; answer: string }[];
  status: "draft" | "scheduled" | "published";
  publishedAt?: string | null;
}

interface PostEditorProps {
  initialData?: PostEditorData;
  isEdit?: boolean;
}

export default function PostEditor({ initialData, isEdit = false }: PostEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!isEdit);
  const [contentHtml, setContentHtml] = useState(initialData?.contentHtml || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || "");
  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialData?.featuredImageUrl || "");
  const [featuredImageAlt, setFeaturedImageAlt] = useState(initialData?.featuredImageAlt || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [faq, setFaq] = useState<{ question: string; answer: string }[]>(initialData?.faq || []);
  const [status, setStatus] = useState<"draft" | "scheduled" | "published">(
    initialData?.status || "draft"
  );
  const [publishedAt, setPublishedAt] = useState(
    initialData?.publishedAt ? new Date(initialData.publishedAt).toISOString().slice(0, 16) : ""
  );

  const [viewMode, setViewMode] = useState<"write" | "split" | "preview">("write");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auto-slug generator from title
  function handleTitleChange(val: string) {
    setTitle(val);
    if (autoSlug) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-");
      setSlug(generated);
    }
  }

  // Tags handler
  function handleAddTag() {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim();
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput("");
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  // FAQ Handlers
  function handleAddFaq() {
    setFaq([...faq, { question: "", answer: "" }]);
  }

  function handleUpdateFaq(index: number, field: "question" | "answer", val: string) {
    const updated = [...faq];
    updated[index][field] = val;
    setFaq(updated);
  }

  function handleRemoveFaq(index: number) {
    setFaq(faq.filter((_, i) => i !== index));
  }

  // Quick Format Injector
  function insertFormat(openTag: string, closeTag = "") {
    const textarea = document.getElementById("content-editor") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = contentHtml.substring(start, end);
    const replacement = `${openTag}${selected}${closeTag}`;

    const newContent = contentHtml.substring(0, start) + replacement + contentHtml.substring(end);
    setContentHtml(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, end + openTag.length);
    }, 0);
  }

  // Media direct upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("file", file);
    if (featuredImageAlt) formData.append("alt", featuredImageAlt);

    try {
      const res = await fetch("/api/v1/media", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CMS_API_KEY || ""}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to upload image");

      setFeaturedImageUrl(data.url);
      if (!featuredImageAlt) setFeaturedImageAlt(file.name.replace(/\.[^/.]+$/, ""));
      setFeedback({ type: "success", message: "Image uploaded to Cloudinary successfully!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Upload failed" });
    } finally {
      setUploadingImage(false);
    }
  }

  // Save / Publish
  async function handleSave(overrideStatus?: "draft" | "published") {
    const targetStatus = overrideStatus || status;

    if (!title.trim()) {
      setFeedback({ type: "error", message: "Article title is required." });
      return;
    }
    if (!contentHtml.trim()) {
      setFeedback({ type: "error", message: "Article content is required." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const payload = {
      title,
      slug: slug.trim() || undefined,
      content_html: contentHtml,
      excerpt: excerpt.trim() || undefined,
      meta_description: metaDescription.trim() || undefined,
      featured_image_url: featuredImageUrl.trim() || undefined,
      featured_image_alt: featuredImageAlt.trim() || undefined,
      tags,
      faq,
      status: targetStatus,
      published_at:
        targetStatus === "scheduled" && publishedAt
          ? new Date(publishedAt).toISOString()
          : targetStatus === "published"
          ? new Date().toISOString()
          : null,
    };

    try {
      const url = isEdit && initialData?.id ? `/api/v1/posts/${initialData.id}` : "/api/v1/posts";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CMS_API_KEY || ""}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to save article");

      setFeedback({
        type: "success",
        message: targetStatus === "published" ? "Article published successfully!" : "Draft saved successfully!",
      });

      if (!isEdit && data.id) {
        router.push(`/admin/posts/${data.id}/edit`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save post" });
    } finally {
      setLoading(false);
    }
  }

  // Delete article
  async function handleDelete() {
    if (!initialData?.id) return;
    if (!confirm("Are you sure you want to permanently delete this article?")) return;

    try {
      const res = await fetch(`/api/v1/posts/${initialData.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CMS_API_KEY || ""}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin/posts");
      router.refresh();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {isEdit ? "Edit Article" : "Create New Article"}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Status: <span className="font-semibold text-slate-200">{status}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition"
              title="Delete Article"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSave("draft")}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSave("published")}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Publish Article</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Grid: Left Editor & Right Meta Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Title, Slug, WYSIWYG Content, FAQ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Article Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. 7 Best AI Tools for Freelancers in 2026"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">URL Slug *</label>
                <button
                  type="button"
                  onClick={() => setAutoSlug(!autoSlug)}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {autoSlug ? <Lock className="w-3 h-3 text-indigo-400" /> : <Unlock className="w-3 h-3 text-amber-400" />}
                  <span>{autoSlug ? "Auto-synced with title" : "Custom editable"}</span>
                </button>
              </div>
              <div className="flex items-center rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2">
                <span className="text-xs text-slate-500 font-mono">stackyup.com/</span>
                <input
                  type="text"
                  value={slug}
                  disabled={autoSlug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-slug-url"
                  className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none disabled:opacity-75"
                />
              </div>
            </div>
          </div>

          {/* Content Editor with Mode Switcher & HTML Toolbar */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <label className="text-xs font-semibold text-slate-300">Article Content (HTML Clean) *</label>

              {/* View Mode Toggle */}
              <div className="flex items-center p-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("write")}
                  className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                    viewMode === "write" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("split")}
                  className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                    viewMode === "split" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                    viewMode === "preview" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            {/* Quick HTML Toolbar Buttons */}
            {viewMode !== "preview" && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => insertFormat("<h2>", "</h2>")}
                  className="px-2 py-1 rounded text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat("<h3>", "</h3>")}
                  className="px-2 py-1 rounded text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat("<strong>", "</strong>")}
                  className="px-2 py-1 rounded text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat("<em>", "</em>")}
                  className="px-2 py-1 rounded text-xs italic text-slate-300 hover:bg-slate-800"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat("<blockquote><p>", "</p></blockquote>")}
                  className="px-2 py-1 rounded text-xs text-slate-300 hover:bg-slate-800"
                >
                  Quote
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat("<ul>\n  <li>", "</li>\n</ul>")}
                  className="px-2 py-1 rounded text-xs text-slate-300 hover:bg-slate-800"
                >
                  Bullet List
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat("<pre><code>", "</code></pre>")}
                  className="px-2 py-1 rounded text-xs font-mono text-slate-300 hover:bg-slate-800"
                >
                  Code
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat('<a href="https://..." target="_blank" rel="noopener noreferrer">', "</a>")}
                  className="px-2 py-1 rounded text-xs text-indigo-400 hover:bg-slate-800"
                >
                  Link
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertFormat(
                      '<div class="overflow-x-auto">\n<table class="w-full border">\n  <thead><tr><th class="border p-2">Feature</th><th class="border p-2">Tool A</th><th class="border p-2">Tool B</th></tr></thead>\n  <tbody><tr><td class="border p-2">Price</td><td class="border p-2">$10</td><td class="border p-2">$20</td></tr></tbody>\n</table>\n</div>'
                    )
                  }
                  className="px-2 py-1 rounded text-xs text-sky-400 hover:bg-slate-800"
                >
                  Table
                </button>
              </div>
            )}

            {/* Split / Single View Editor Area */}
            <div className={`grid gap-4 ${viewMode === "split" ? "grid-cols-2" : "grid-cols-1"}`}>
              {viewMode !== "preview" && (
                <textarea
                  id="content-editor"
                  rows={18}
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  placeholder="<p>Write your article content using clean HTML tags...</p>"
                  className="w-full p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                />
              )}

              {viewMode !== "write" && (
                <div className="p-6 rounded-xl bg-slate-950/50 border border-slate-800 max-h-[500px] overflow-y-auto prose prose-invert prose-sm max-w-none">
                  {contentHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                  ) : (
                    <p className="text-slate-500 italic">Preview will render here...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* FAQ Builder (Schema Q&A) */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  <span>FAQ Builder (Schema.org JSON-LD)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Frequently Asked Questions are automatically embedded in Google FAQPage Rich Snippets.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddFaq}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-xs border border-indigo-500/30 transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            {faq.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center">
                No FAQ items yet. Click &quot;Add FAQ&quot; to add structured Q&A pairs for Google search snippets.
              </p>
            ) : (
              <div className="space-y-3">
                {faq.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(idx)}
                      className="absolute top-3 right-3 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <input
                        type="text"
                        value={item.question}
                        onChange={(e) => handleUpdateFaq(idx, "question", e.target.value)}
                        placeholder="Question (e.g. Is there a free trial?)"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <textarea
                        rows={2}
                        value={item.answer}
                        onChange={(e) => handleUpdateFaq(idx, "answer", e.target.value)}
                        placeholder="Answer (e.g. Yes, a 14-day free trial is available without credit card.)"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SEO Metadata, Featured Image, Status & Tags */}
        <div className="space-y-6">
          {/* Status & Schedule Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Publishing Status</h3>
            <div className="grid grid-cols-3 gap-2">
              {(["draft", "scheduled", "published"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition cursor-pointer ${
                    status === s
                      ? s === "published"
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : s === "scheduled"
                        ? "bg-sky-600 text-white border-sky-500"
                        : "bg-amber-600 text-white border-amber-500"
                      : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {status === "scheduled" && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Scheduled Publish Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            )}
          </div>

          {/* Featured Image Box */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <span>Featured Image (WebP CDN)</span>
            </h3>

            {featuredImageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-800 group">
                <img
                  src={featuredImageUrl}
                  alt={featuredImageAlt || "Featured image"}
                  className="w-full h-36 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFeaturedImageUrl("")}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 text-rose-400 hover:bg-rose-500/20 transition"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/40"
              >
                <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-300">Click to upload image</p>
                <p className="text-[11px] text-slate-500 mt-1">Uploads directly to Cloudinary (folder: stackyup)</p>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Image URL</label>
              <input
                type="text"
                value={featuredImageUrl}
                onChange={(e) => setFeaturedImageUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/..."
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Alt Text (Mandatory for SEO) *
              </label>
              <input
                type="text"
                value={featuredImageAlt}
                onChange={(e) => setFeaturedImageAlt(e.target.value)}
                placeholder="Descriptive alt text for image"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* SEO Meta Box */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>SEO Meta Snippets</span>
            </h3>

            {/* Meta Description Counter */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-400">Meta Description</label>
                <span
                  className={`text-[10px] font-mono ${
                    metaDescription.length > 160
                      ? "text-rose-400 font-bold"
                      : metaDescription.length >= 140
                      ? "text-amber-400"
                      : "text-slate-500"
                  }`}
                >
                  {metaDescription.length} / 160
                </span>
              </div>
              <textarea
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Concise, captivating meta description for Google SERP..."
                className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Article Excerpt</label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary displayed on article feed cards..."
                className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Tags Box */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tags / Categories</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag and press Enter"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs border border-slate-700"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
