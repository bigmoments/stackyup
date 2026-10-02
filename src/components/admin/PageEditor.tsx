"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  CheckCircle2,
  Eye,
  Edit3,
  Code,
  Image as ImageIcon,
  Plus,
  Trash2,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Link2,
  Table as TableIcon,
  Minus,
  Lightbulb,
  AlertTriangle,
  Info,
  Undo,
  Redo,
  RemoveFormatting,
  Smartphone,
  Tablet,
  Monitor,
  ExternalLink,
  ChevronDown,
  X,
  Upload,
  History,
  Check,
} from "lucide-react";
import { useDialog } from "@/components/ui/CustomDialog";

export interface PageEditorData {
  id?: string;
  title: string;
  slug: string;
  contentHtml: string;
  metaDescription?: string | null;
  status: "draft" | "published";
}

export interface PageRevisionItem {
  id: string;
  title: string | null;
  contentHtml: string;
  createdAt: Date | string;
}

interface PageEditorProps {
  initialData?: PageEditorData;
  revisions?: PageRevisionItem[];
  isEdit?: boolean;
}

function getEditorHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (process.env.NEXT_PUBLIC_CMS_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_CMS_API_KEY}`;
  }
  return headers;
}

function cleanPastedHtml(html: string): string {
  if (!html) return "";
  let clean = html;
  clean = clean.replace(/<!--[\s\S]*?-->/gi, "");
  clean = clean.replace(/<\/?(o|w|m|xml):[^>]*>/gi, "");
  clean = clean.replace(/<(script|style|meta|link|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, "");
  clean = clean.replace(/<(meta|link)[^>]*>/gi, "");
  clean = clean.replace(/\sstyle="[^"]*"/gi, "");
  clean = clean.replace(/\sclass="(mso|apple)[^"]*"/gi, "");
  clean = clean.replace(/<b(\s[^>]*)?>/gi, "<strong>").replace(/<\/b>/gi, "</strong>");
  clean = clean.replace(/<i(\s[^>]*)?>/gi, "<em>").replace(/<\/i>/gi, "</em>");
  clean = clean.replace(/<span>(.*?)<\/span>/gi, "$1");
  clean = clean.replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, "");
  return clean.trim();
}

export default function PageEditor({
  initialData,
  revisions = [],
  isEdit = false,
}: PageEditorProps) {
  const router = useRouter();
  const dialog = useDialog();
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [isSlugLocked, setIsSlugLocked] = useState(isEdit);
  const [contentHtml, setContentHtml] = useState(initialData?.contentHtml || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || "");
  const [status, setStatus] = useState<"draft" | "published">(initialData?.status || "published");

  // UI State
  const [activeTab, setActiveTab] = useState<"visual" | "code" | "split">("visual");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [savedSelectionRange, setSavedSelectionRange] = useState<Range | null>(null);

  // Sync initial visual content
  useEffect(() => {
    if (visualEditorRef.current && visualEditorRef.current.innerHTML !== contentHtml) {
      visualEditorRef.current.innerHTML = contentHtml;
    }
  }, []);

  function showToast(text: string, type: "success" | "error" = "success") {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Auto-slug generator
  function handleTitleChange(val: string) {
    setTitle(val);
    if (!isSlugLocked) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  }

  // Handle content updates from visual editor
  const handleVisualInput = useCallback(() => {
    if (visualEditorRef.current) {
      setContentHtml(visualEditorRef.current.innerHTML);
    }
  }, []);

  // Handle paste in visual editor to strip dirty styles
  function handleVisualPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (html) {
      const cleaned = cleanPastedHtml(html);
      document.execCommand("insertHTML", false, cleaned);
    } else if (text) {
      document.execCommand("insertText", false, text);
    }
    handleVisualInput();
  }

  // Formatting actions
  function execFormat(command: string, value: string | undefined = undefined) {
    if (activeTab === "code") return;
    visualEditorRef.current?.focus();
    document.execCommand(command, false, value);
    handleVisualInput();
  }

  function handleHeading(level: 1 | 2 | 3 | 4) {
    execFormat("formatBlock", `<h${level}>`);
  }

  function handleParagraph() {
    execFormat("formatBlock", "<p>");
  }

  function openLinkModal() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedSelectionRange(sel.getRangeAt(0));
    }
    setLinkUrl("");
    setShowLinkModal(true);
  }

  function insertLink() {
    if (!linkUrl.trim()) {
      setShowLinkModal(false);
      return;
    }
    if (savedSelectionRange) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelectionRange);
    }
    execFormat("createLink", linkUrl.trim());
    setShowLinkModal(false);
    setLinkUrl("");
  }

  function insertTable() {
    const tableHtml = `
      <table class="w-full border-collapse my-4 border border-[#e8ece9]">
        <thead>
          <tr class="bg-[#f8faf9] border-b border-[#e8ece9]">
            <th class="p-3 text-left font-semibold text-xs border-r border-[#e8ece9]">Header 1</th>
            <th class="p-3 text-left font-semibold text-xs">Header 2</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-[#e8ece9]">
            <td class="p-3 text-xs border-r border-[#e8ece9]">Data 1</td>
            <td class="p-3 text-xs">Data 2</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    execFormat("insertHTML", tableHtml);
  }

  function insertCallout(type: "info" | "tip" | "warning") {
    let bg = "bg-[#f4fbf7] border-[#c1ebd4] text-[#078a4b]";
    let icon = "💡";
    let titleText = "Key Takeaway";

    if (type === "warning") {
      bg = "bg-amber-50 border-amber-200 text-amber-900";
      icon = "⚠️";
      titleText = "Notice / Disclaimer";
    } else if (type === "info") {
      bg = "bg-sky-50 border-sky-200 text-sky-900";
      icon = "ℹ️";
      titleText = "Important Information";
    }

    const html = `
      <div class="my-5 p-4 rounded-xl border ${bg} text-xs leading-relaxed space-y-1">
        <div class="font-bold flex items-center gap-1.5">${icon} <span>${titleText}</span></div>
        <p>Type your message or policy guidance here...</p>
      </div>
      <p><br></p>
    `;
    execFormat("insertHTML", html);
  }

  // Upload inline image via media API
  async function handleInlineImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt", file.name);

      const res = await fetch("/api/v1/media", {
        method: "POST",
        headers: getEditorHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to upload image");
      }

      const imgUrl = data.url || data.data?.url;
      const imgAlt = data.alt || data.data?.alt || title;

      const imgHtml = `
        <figure class="my-6">
          <img src="${imgUrl}" alt="${imgAlt}" class="rounded-xl max-w-full h-auto border border-[#e8ece9] mx-auto" />
          <figcaption class="text-center text-xs text-[#8a9099] mt-2 italic">${imgAlt || ""}</figcaption>
        </figure>
        <p><br></p>
      `;
      execFormat("insertHTML", imgHtml);
      showToast("Image uploaded and inserted successfully!");
    } catch (err: any) {
      showToast(err.message || "Image upload failed", "error");
    } finally {
      setIsUploadingImage(false);
      if (inlineImageInputRef.current) inlineImageInputRef.current.value = "";
    }
  }

  // Save or Publish Page
  async function handleSave(newStatus?: "draft" | "published") {
    if (!title.trim()) {
      showToast("Page Title is required", "error");
      return;
    }

    const finalStatus = newStatus || status;
    const finalContent = activeTab === "visual" && visualEditorRef.current
      ? visualEditorRef.current.innerHTML
      : contentHtml;

    if (!finalContent.trim()) {
      showToast("Page content cannot be empty", "error");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      content_html: finalContent,
      meta_description: metaDescription.trim() || undefined,
      status: finalStatus,
    };

    try {
      if (isEdit && initialData?.id) {
        // PATCH
        const res = await fetch(`/api/v1/pages/${initialData.id}`, {
          method: "PATCH",
          headers: getEditorHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to update page");

        setStatus(finalStatus);
        showToast("Static page updated successfully!");
        router.refresh();
      } else {
        // POST
        const res = await fetch("/api/v1/pages", {
          method: "POST",
          headers: getEditorHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to create page");

        showToast("Static page published successfully!");
        router.push(`/admin/pages/${data.data.id}/edit`);
        router.refresh();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save page", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Word count & reading time
  const plainText = contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText ? plainText.split(" ").length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-200 ${
            toastMessage.type === "success"
              ? "bg-[#078a4b] text-white border-[#066a3d]"
              : "bg-rose-600 text-white border-rose-700"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6EBE8]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pages"
            className="p-2 rounded-xl text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition"
            title="Back to Pages List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block">
              Static Pages Editor
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#101313]">
              {isEdit ? "Edit Static Page" : "Create New Static Page"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {isEdit && slug && (
            <Link
              href={`/page/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6EBE8] text-[#101313] hover:bg-[#F8FAF9] text-xs font-semibold transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#078a4b]" />
              <span>View Live</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={isSubmitting}
            className="px-3.5 py-2 rounded-xl border border-[#E6EBE8] bg-white text-[#101313] hover:bg-[#F8FAF9] text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "Saving..." : "Publish Page"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Editor & Right Metadata Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left Column: Title, Slug, & Editor */}
        <div className="space-y-5">
          {/* Title & Slug Box */}
          <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#101313] mb-1.5">
                Page Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Privacy Policy, Terms of Service, About StackYup..."
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E6EBE8] bg-[#F8FAF9] text-base font-bold text-[#101313] placeholder:text-[#8a9099] focus:outline-none focus:border-[#079653] focus:bg-white transition"
              />
            </div>

            {/* Slug Configuration */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#667085]">
                  URL Slug &amp; Permalink
                </label>
                <button
                  type="button"
                  onClick={() => setIsSlugLocked(!isSlugLocked)}
                  className="text-[11px] font-semibold text-[#079653] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {isSlugLocked ? (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Unlock Slug</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3" />
                      <span>Lock Slug</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center rounded-xl border border-[#E6EBE8] bg-[#F8FAF9] overflow-hidden text-xs">
                <span className="px-3.5 py-2 text-[#8a9099] bg-[#F0F3F1] border-r border-[#E6EBE8] font-mono select-none">
                  stackyup.com/page/
                </span>
                <input
                  type="text"
                  value={slug}
                  disabled={isSlugLocked}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="privacy-policy"
                  className="flex-1 px-3 py-2 bg-transparent text-[#101313] font-mono text-xs focus:outline-none disabled:opacity-70"
                />
              </div>
            </div>
          </div>

          {/* Editor Workspace Card */}
          <div className="rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs overflow-hidden">
            {/* Editor Top Toolbar: Tabs & Format Buttons */}
            <div className="bg-[#FAFCFB] border-b border-[#E6EBE8] p-3 space-y-3">
              {/* Row 1: Mode Switcher & Word Counts */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center bg-[#F0F3F1] p-1 rounded-xl gap-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === "code" && visualEditorRef.current) {
                        visualEditorRef.current.innerHTML = contentHtml;
                      }
                      setActiveTab("visual");
                    }}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "visual"
                        ? "bg-white text-[#101313] shadow-xs"
                        : "text-[#667085] hover:text-[#101313]"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Visual Editor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === "visual" && visualEditorRef.current) {
                        setContentHtml(visualEditorRef.current.innerHTML);
                      }
                      setActiveTab("code");
                    }}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "code"
                        ? "bg-white text-[#101313] shadow-xs"
                        : "text-[#667085] hover:text-[#101313]"
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>HTML Source</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (visualEditorRef.current) {
                        setContentHtml(visualEditorRef.current.innerHTML);
                      }
                      setActiveTab("split");
                    }}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "split"
                        ? "bg-white text-[#101313] shadow-xs"
                        : "text-[#667085] hover:text-[#101313]"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#8a9099]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{readingTime} min read</span>
                  </span>
                  <span>•</span>
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{contentHtml.length} chars</span>
                </div>
              </div>

              {/* Row 2: Rich Formatting Toolbar (Only in visual/split mode) */}
              {activeTab !== "code" && (
                <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-[#E6EBE8] text-xs">
                  {/* History */}
                  <button
                    type="button"
                    onClick={() => execFormat("undo")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat("redo")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-5 bg-[#E6EBE8] mx-1" />

                  {/* Text Style */}
                  <button
                    type="button"
                    onClick={() => execFormat("bold")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat("italic")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat("underline")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat("strikeThrough")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-5 bg-[#E6EBE8] mx-1" />

                  {/* Headings */}
                  <button
                    type="button"
                    onClick={() => handleHeading(2)}
                    className="px-2 py-1 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] font-bold text-xs transition cursor-pointer"
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHeading(3)}
                    className="px-2 py-1 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] font-bold text-xs transition cursor-pointer"
                    title="Heading 3"
                  >
                    H3
                  </button>
                  <button
                    type="button"
                    onClick={handleParagraph}
                    className="px-2 py-1 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] font-semibold text-xs transition cursor-pointer"
                    title="Paragraph"
                  >
                    P
                  </button>

                  <div className="w-[1px] h-5 bg-[#E6EBE8] mx-1" />

                  {/* Lists */}
                  <button
                    type="button"
                    onClick={() => execFormat("insertUnorderedList")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat("insertOrderedList")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormat("formatBlock", "<blockquote>")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
                    title="Blockquote"
                  >
                    <Quote className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-5 bg-[#E6EBE8] mx-1" />

                  {/* Inserts: Link, Image, Table, Callout */}
                  <button
                    type="button"
                    onClick={openLinkModal}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
                    title="Insert Link"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => inlineImageInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#079653] hover:bg-[#F0F3F1] transition cursor-pointer disabled:opacity-50"
                    title="Upload & Insert Image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={inlineImageInputRef}
                    onChange={handleInlineImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={insertTable}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
                    title="Insert Table"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => execFormat("insertHorizontalRule")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
                    title="Horizontal Line"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-5 bg-[#E6EBE8] mx-1" />

                  {/* Callouts */}
                  <button
                    type="button"
                    onClick={() => insertCallout("tip")}
                    className="px-2 py-1 rounded-lg text-[#079653] hover:bg-[#EAF8F0] font-semibold text-xs transition cursor-pointer"
                    title="Insert Tip Callout"
                  >
                    💡 Tip
                  </button>
                  <button
                    type="button"
                    onClick={() => insertCallout("warning")}
                    className="px-2 py-1 rounded-lg text-amber-700 hover:bg-amber-50 font-semibold text-xs transition cursor-pointer"
                    title="Insert Warning Box"
                  >
                    ⚠️ Notice
                  </button>

                  <button
                    type="button"
                    onClick={() => execFormat("removeFormat")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-auto"
                    title="Clear Formatting"
                  >
                    <RemoveFormatting className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Editor Workspace Content */}
            <div className="min-h-[500px]">
              {/* 1. Visual Mode */}
              {activeTab === "visual" && (
                <div
                  ref={visualEditorRef}
                  contentEditable
                  onInput={handleVisualInput}
                  onPaste={handleVisualPaste}
                  className="p-6 sm:p-8 min-h-[500px] outline-none medium-prose prose-sm max-w-none focus:ring-0"
                  data-placeholder="Write the page content here..."
                />
              )}

              {/* 2. Code Mode */}
              {activeTab === "code" && (
                <textarea
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  className="w-full h-[550px] p-6 font-mono text-xs text-[#101313] bg-[#F8FAF9] outline-none resize-y leading-relaxed border-none"
                  placeholder="<h2>Section Title</h2><p>Page description...</p>"
                />
              )}

              {/* 3. Split Live Mode */}
              {activeTab === "split" && (
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E6EBE8]">
                  <textarea
                    value={contentHtml}
                    onChange={(e) => {
                      setContentHtml(e.target.value);
                      if (visualEditorRef.current) {
                        visualEditorRef.current.innerHTML = e.target.value;
                      }
                    }}
                    className="w-full h-[550px] p-5 font-mono text-xs text-[#101313] bg-[#F8FAF9] outline-none resize-none leading-relaxed"
                    placeholder="Edit raw HTML..."
                  />
                  <div className="p-6 h-[550px] overflow-y-auto bg-white medium-prose prose-sm">
                    <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Revisions */}
        <div className="space-y-6">
          {/* Status & Visibility Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#667085]">
              Page Status
            </h3>

            <div className="space-y-2">
              <label
                onClick={() => setStatus("published")}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  status === "published"
                    ? "bg-[#EAF8F0] border-[#079653] text-[#079653]"
                    : "border-[#E6EBE8] text-[#667085] hover:bg-[#F8FAF9]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Published (Live)</span>
                </div>
                {status === "published" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </label>

              <label
                onClick={() => setStatus("draft")}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  status === "draft"
                    ? "bg-amber-50 border-amber-500 text-amber-800"
                    : "border-[#E6EBE8] text-[#667085] hover:bg-[#F8FAF9]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Draft (Hidden)</span>
                </div>
                {status === "draft" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </label>
            </div>
          </div>

          {/* SEO & Metadata Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#667085]">
                SEO Meta Description
              </h3>
              <span className={`text-[11px] font-mono ${metaDescription.length > 160 ? "text-rose-600 font-bold" : "text-[#8a9099]"}`}>
                {metaDescription.length}/160
              </span>
            </div>

            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Concise overview of this institutional policy or about page for Google search results..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E6EBE8] bg-[#F8FAF9] text-[#101313] placeholder:text-[#8a9099] focus:outline-none focus:border-[#079653] focus:bg-white transition"
            />
            <p className="text-[11px] text-[#8a9099] leading-relaxed">
              Recommended: 120–160 characters. Displayed under page title in search engine snippets.
            </p>
          </div>

          {/* Revision History Card (in Edit Mode) */}
          {isEdit && revisions.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#101313]">
                  <History className="w-4 h-4 text-[#079653]" />
                  <span>Revisions ({revisions.length})</span>
                </div>
                <span className="text-[11px] text-[#8a9099]">Version backups</span>
              </div>

              <div className="divide-y divide-[#E6EBE8] max-h-60 overflow-y-auto pr-1">
                {revisions.map((rev, idx) => (
                  <div key={rev.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-[#101313] block">
                        Version #{revisions.length - idx}
                      </span>
                      <span className="text-[11px] text-[#8a9099]">
                        {new Date(rev.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await dialog.confirm(
                          "Pulihkan Versi Ini?",
                          "Konten di editor saat ini akan digantikan dengan riwayat versi terpilih.",
                          "Ya, Pulihkan Versi"
                        );
                        if (ok) {
                          setContentHtml(rev.contentHtml);
                          if (visualEditorRef.current) {
                            visualEditorRef.current.innerHTML = rev.contentHtml;
                          }
                          showToast(`Restored version #${revisions.length - idx}`);
                        }
                      }}
                      className="px-2 py-1 rounded-md text-[11px] font-semibold text-[#079653] hover:bg-[#EAF8F0] transition cursor-pointer"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Link Insertion Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
              <div className="flex items-center gap-2 text-sm font-bold text-[#101313]">
                <Link2 className="w-4 h-4 text-[#079653]" />
                <span>Insert Hyperlink</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded-lg text-[#667085] hover:text-[#101313]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">
                Target URL
              </label>
              <input
                type="url"
                placeholder="https://example.com or /page/about"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    insertLink();
                  }
                }}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E6EBE8] bg-[#F8FAF9] text-[#101313] focus:outline-none focus:border-[#079653] focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3.5 py-1.5 text-xs text-[#667085] hover:text-[#101313]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertLink}
                className="px-4 py-1.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white text-xs font-semibold transition"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
