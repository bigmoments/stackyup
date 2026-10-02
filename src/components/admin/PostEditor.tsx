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
  HelpCircle,
  Clock,
  Sparkles,
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
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Link2,
  Table as TableIcon,
  Minus,
  Video,
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
  Calendar,
  Layers,
  RotateCcw,
  Check,
  Maximize,
  Minimize,
  Palette,
  Unlink,
  Indent,
  Outdent,
  Subscript,
  Superscript,
  Highlighter,
  FileCode,
  Braces,
  FileText,
  Type,
  Copy,
  Download,
  FileDown,
} from "lucide-react";

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
  authorName?: string | null;
}

function getEditorHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (process.env.NEXT_PUBLIC_CMS_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_CMS_API_KEY}`;
  }
  return headers;
}


interface PostEditorProps {
  initialData?: PostEditorData;
  isEdit?: boolean;
}

const CATEGORIES = [
  "AI Tools",
  "Comparisons",
  "Freelancers",
  "Reviews",
  "Tech",
  "Productivity",
];

const TEXT_COLORS = [
  { name: "Default (Charcoal)", color: "#101313" },
  { name: "StackYup Emerald", color: "#078a4b" },
  { name: "Slate Blue", color: "#2563eb" },
  { name: "Amber Bronze", color: "#b45309" },
  { name: "Crimson Red", color: "#b91c1c" },
  { name: "Royal Purple", color: "#7c3aed" },
  { name: "Muted Slate", color: "#64748b" },
];

const HIGHLIGHT_COLORS = [
  { name: "None (Clear)", color: "transparent" },
  { name: "Pastel Yellow", color: "#fef08a" },
  { name: "Mint Green", color: "#bbf7d0" },
  { name: "Sky Blue", color: "#bae6fd" },
  { name: "Peach Coral", color: "#fed7aa" },
  { name: "Lavender", color: "#e9d5ff" },
];

const CODE_LANGUAGES = [
  { id: "javascript", label: "JavaScript (JS)" },
  { id: "typescript", label: "TypeScript (TS)" },
  { id: "python", label: "Python (PY)" },
  { id: "html", label: "HTML / XML" },
  { id: "css", label: "CSS / Tailwind" },
  { id: "bash", label: "Bash / Terminal" },
  { id: "sql", label: "SQL / Postgres" },
  { id: "json", label: "JSON Data" },
];

/**
 * Enterprise HTML Beautifier for Code Mode
 */
function beautifyHtml(html: string): string {
  let formatted = "";
  let indent = 0;
  const tab = "  ";
  const clean = html.replace(/>\s+</g, "><").trim();
  const tokens = clean.split(/(<\/?[^>]+>)/g).filter(Boolean);
  const voidTags = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);

  for (const token of tokens) {
    if (token.startsWith("</")) {
      indent = Math.max(0, indent - 1);
      formatted += "\n" + tab.repeat(indent) + token;
    } else if (token.startsWith("<")) {
      const match = token.match(/^<([a-z0-9]+)/i);
      const tag = match ? match[1].toLowerCase() : "";
      const isSelfClosing = token.endsWith("/>") || voidTags.has(tag);
      formatted += "\n" + tab.repeat(indent) + token;
      if (!isSelfClosing) indent++;
    } else {
      const text = token.trim();
      if (text) formatted += "\n" + tab.repeat(indent) + text;
    }
  }
  return formatted.trim();
}

/**
 * Smart Paste Normalizer: Strips Word/Google Docs styling slop
 */
function cleanPastedHtml(html: string): string {
  if (!html) return "";
  let clean = html;
  // 1. Remove XML/mso tags and comments
  clean = clean.replace(/<!--[\s\S]*?-->/gi, "");
  clean = clean.replace(/<\/?(o|w|m|xml):[^>]*>/gi, "");
  // 2. Remove scripts and styles
  clean = clean.replace(/<(script|style|meta|link|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, "");
  clean = clean.replace(/<(meta|link)[^>]*>/gi, "");
  // 3. Strip all inline styles to eliminate messy fonts/sizes from Google Docs/Word
  clean = clean.replace(/\sstyle="[^"]*"/gi, "");
  // 4. Strip mso or apple classes
  clean = clean.replace(/\sclass="(mso|apple)[^"]*"/gi, "");
  // 5. Normalize bold and italic
  clean = clean.replace(/<b(\s[^>]*)?>/gi, "<strong>").replace(/<\/b>/gi, "</strong>");
  clean = clean.replace(/<i(\s[^>]*)?>/gi, "<em>").replace(/<\/i>/gi, "</em>");
  // 6. Unwrap redundant empty spans
  clean = clean.replace(/<span>(.*?)<\/span>/gi, "$1");
  // 7. Strip empty paragraphs
  clean = clean.replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, "");
  return clean.trim();
}

export default function PostEditor({ initialData, isEdit = false }: PostEditorProps) {
  const router = useRouter();
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // Form States
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!isEdit);
  const [contentHtml, setContentHtml] = useState(initialData?.contentHtml || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || "");
  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialData?.featuredImageUrl || "");
  const [featuredImageAlt, setFeaturedImageAlt] = useState(initialData?.featuredImageAlt || "");
  const [authorName, setAuthorName] = useState(initialData?.authorName || "Adit");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags || ["AI Tools"]);
  const [faq, setFaq] = useState<{ question: string; answer: string }[]>(initialData?.faq || []);
  const [status, setStatus] = useState<"draft" | "scheduled" | "published">(
    initialData?.status || "draft"
  );
  const [publishedAt, setPublishedAt] = useState(
    initialData?.publishedAt ? new Date(initialData.publishedAt).toISOString().slice(0, 16) : ""
  );

  // Editor View Mode & Layout
  const [viewMode, setViewMode] = useState<"visual" | "html" | "preview">("visual");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pasteAsPlainText, setPasteAsPlainText] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Color Pickers State
  const [showColorDropdown, setShowColorDropdown] = useState<"text" | "highlight" | null>(null);

  // Modals state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkNewTab, setLinkNewTab] = useState(true);
  const [linkNofollow, setLinkNofollow] = useState(false);

  const [showImageModal, setShowImageModal] = useState(false);
  const [inlineImageUrl, setInlineImageUrl] = useState("");
  const [inlineImageAlt, setInlineImageAlt] = useState("");
  const [inlineImageCaption, setInlineImageCaption] = useState("");
  const [inlineImageAlign, setInlineImageAlign] = useState<"center" | "left" | "right" | "full">("center");

  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableZebra, setTableZebra] = useState(true);

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeContent, setCodeContent] = useState("");
  const [codeLang, setCodeLang] = useState("javascript");

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const [showCalloutModal, setShowCalloutModal] = useState(false);
  const [calloutType, setCalloutType] = useState<"tip" | "info" | "warning" | "alert">("tip");
  const [calloutTitle, setCalloutTitle] = useState("");
  const [calloutContent, setCalloutContent] = useState("");

  // Floating Micro-toolbar for Active Link & Image inside Canvas
  const [floatingLink, setFloatingLink] = useState<{
    href: string;
    text: string;
    rect: { top: number; left: number };
    element: HTMLAnchorElement;
  } | null>(null);

  const [floatingImage, setFloatingImage] = useState<{
    src: string;
    alt: string;
    rect: { top: number; left: number };
    element: HTMLElement;
  } | null>(null);

  // Autosave and Recovery state
  const [lastAutosaved, setLastAutosaved] = useState<string | null>(null);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const storageKey = `stackyup:draft:${initialData?.id || "new"}`;

  // Preserve and restore Selection Range
  const saveSelection = useCallback(() => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (typeof window === "undefined" || !savedRangeRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }, []);

  // Initialize visual editor content ONLY on mode switch or mount (avoids cursor jump)
  useEffect(() => {
    if (visualEditorRef.current && viewMode === "visual") {
      if (visualEditorRef.current.innerHTML !== contentHtml) {
        visualEditorRef.current.innerHTML = contentHtml || "<p></p>";
      }
    }
  }, [viewMode]);

  // Check for local draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.contentHtml && parsed.contentHtml !== initialData?.contentHtml) {
          setHasLocalDraft(true);
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey, initialData]);

  // Autosave to localStorage every 10s
  useEffect(() => {
    const timer = setInterval(() => {
      if (!title && !contentHtml) return;
      try {
        const draftObj = {
          title,
          slug,
          contentHtml,
          excerpt,
          metaDescription,
          tags,
          status,
          authorName,
          savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        localStorage.setItem(storageKey, JSON.stringify(draftObj));
        setLastAutosaved(draftObj.savedAt);
      } catch {
        // ignore storage quota error
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [title, slug, contentHtml, excerpt, metaDescription, tags, status, authorName, storageKey]);

  // Global Keyboard Shortcuts (Ctrl+S, Ctrl+K, Fullscreen)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Ctrl+S / Cmd+S: Save Draft
      if (isCmdOrCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave("draft");
      }

      // Ctrl+K / Cmd+K: Insert Link
      if (isCmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        saveSelection();
        const sel = window.getSelection();
        if (sel) setLinkText(sel.toString());
        setShowLinkModal(true);
      }

      // Escape: Exit Fullscreen or dismiss menus
      if (e.key === "Escape") {
        if (isFullscreen) setIsFullscreen(false);
        setShowColorDropdown(null);
        setFloatingLink(null);
        setFloatingImage(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, title, contentHtml, slug]);

  function restoreLocalDraft() {
    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.slug) setSlug(parsed.slug);
        if (parsed.contentHtml) {
          setContentHtml(parsed.contentHtml);
          if (visualEditorRef.current) visualEditorRef.current.innerHTML = parsed.contentHtml;
        }
        if (parsed.excerpt) setExcerpt(parsed.excerpt);
        if (parsed.metaDescription) setMetaDescription(parsed.metaDescription);
        if (parsed.tags) setTags(parsed.tags);
        if (parsed.authorName) setAuthorName(parsed.authorName);
        setHasLocalDraft(false);
        setFeedback({
          type: "success",
          message: `Draft restored from local cache (saved at ${parsed.savedAt || "earlier"}).`,
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to restore draft." });
    }
  }

  // Handle Title Change with Auto-slug
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

  // Visual Editor Input Handler (Authoritative DOM to State)
  const handleVisualInput = useCallback(() => {
    if (visualEditorRef.current) {
      const html = visualEditorRef.current.innerHTML;
      setContentHtml(html);
    }
  }, []);

  // Format Execution in Visual WYSIWYG
  function execCmd(command: string, value: string | undefined = undefined) {
    if (viewMode !== "visual") return;
    visualEditorRef.current?.focus();
    document.execCommand(command, false, value);
    handleVisualInput();
  }

  // Smart Paste Handler (Prevents dirty styles / Word slop)
  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    if (pasteAsPlainText) {
      const text = e.clipboardData.getData("text/plain");
      const paragraphs = text
        .split(/\r?\n\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${p.replace(/\r?\n/g, "<br />")}</p>`)
        .join("");
      insertCustomHtml(paragraphs || `<p>${text}</p>`);
      return;
    }

    const html = e.clipboardData.getData("text/html");
    if (html) {
      const cleaned = cleanPastedHtml(html);
      insertCustomHtml(cleaned);
    } else {
      const text = e.clipboardData.getData("text/plain");
      const paragraphs = text
        .split(/\r?\n\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${p.replace(/\r?\n/g, "<br />")}</p>`)
        .join("");
      insertCustomHtml(paragraphs || `<p>${text}</p>`);
    }
  }

  // Insert HTML snippet into Visual or Code editor with Exact Cursor Placement
  function insertCustomHtml(htmlSnippet: string) {
    if (viewMode === "visual") {
      visualEditorRef.current?.focus();
      restoreSelection();
      const success = document.execCommand("insertHTML", false, htmlSnippet);
      if (!success) {
        // Range fallback
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const temp = document.createElement("div");
          temp.innerHTML = htmlSnippet;
          const frag = document.createDocumentFragment();
          let node;
          let lastNode = null;
          while ((node = temp.firstChild)) {
            lastNode = frag.appendChild(node);
          }
          range.insertNode(frag);
          if (lastNode) {
            range.setStartAfter(lastNode);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }
      handleVisualInput();
    } else {
      const textarea = document.getElementById("content-editor") as HTMLTextAreaElement | null;
      if (!textarea) {
        setContentHtml((prev) => prev + "\n" + htmlSnippet);
        return;
      }
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = contentHtml.substring(0, start) + htmlSnippet + contentHtml.substring(end);
      setContentHtml(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + htmlSnippet.length, start + htmlSnippet.length);
      }, 0);
    }
  }

  // Link Insertion
  function handleInsertLink() {
    if (!linkUrl.trim()) return;
    const target = linkNewTab ? ' target="_blank"' : "";
    const rel = linkNofollow ? ' rel="nofollow noopener noreferrer"' : ' rel="noopener noreferrer"';
    const text = linkText.trim() || linkUrl;
    const linkHtml = `<a href="${linkUrl.trim()}"${target}${rel} class="text-[#078a4b] underline hover:text-[#066a3d] font-medium">${text}</a>`;
    insertCustomHtml(linkHtml);
    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
    setFloatingLink(null);
  }

  // Remove / Unlink
  function handleUnlinkActive() {
    if (floatingLink?.element) {
      const text = floatingLink.element.innerText;
      floatingLink.element.replaceWith(document.createTextNode(text));
      handleVisualInput();
      setFloatingLink(null);
    }
  }

  // Image Insertion directly into article content
  function handleInsertInlineImage() {
    if (!inlineImageUrl.trim()) return;
    const alignClasses =
      inlineImageAlign === "center"
        ? "mx-auto block text-center"
        : inlineImageAlign === "left"
        ? "float-left mr-6 mb-4 max-w-sm"
        : inlineImageAlign === "right"
        ? "float-right ml-6 mb-4 max-w-sm"
        : "w-full block";

    const imageHtml = `
<figure class="my-6 ${alignClasses}">
  <img src="${inlineImageUrl.trim()}" alt="${inlineImageAlt.trim() || "Article image"}" class="rounded-xl border border-[#e8ece9] shadow-xs w-full max-h-[520px] object-cover" loading="lazy" />
  ${inlineImageCaption.trim() ? `<figcaption class="text-xs text-[#667085] mt-2 italic text-center">${inlineImageCaption.trim()}</figcaption>` : ""}
</figure>
<p></p>`;

    insertCustomHtml(imageHtml);
    setShowImageModal(false);
    setInlineImageUrl("");
    setInlineImageAlt("");
    setInlineImageCaption("");
    setFloatingImage(null);
  }

  // Float image alignment updater
  function handleUpdateImageAlignment(align: "center" | "left" | "right" | "full") {
    if (!floatingImage?.element) return;
    const alignClasses = {
      center: "mx-auto block text-center",
      left: "float-left mr-6 mb-4 max-w-sm",
      right: "float-right ml-6 mb-4 max-w-sm",
      full: "w-full block",
    }[align];

    floatingImage.element.className = `my-6 ${alignClasses}`;
    handleVisualInput();
    setFloatingImage(null);
  }

  // Float image delete
  function handleDeleteActiveImage() {
    if (floatingImage?.element) {
      floatingImage.element.remove();
      handleVisualInput();
      setFloatingImage(null);
    }
  }

  // Upload image to Cloudinary for inline use
  async function handleInlineImageFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    if (inlineImageAlt) formData.append("alt", inlineImageAlt);

    try {
      const res = await fetch("/api/v1/media", {
        method: "POST",
        headers: getEditorHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to upload");
      setInlineImageUrl(data.url);
      if (!inlineImageAlt) setInlineImageAlt(file.name.replace(/\.[^/.]+$/, ""));
      setFeedback({ type: "success", message: "Image uploaded! Ready to embed." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to upload image" });
    } finally {
      setUploadingImage(false);
    }
  }

  // Comparison Table Insertion
  function handleInsertTable() {
    let tableHtml = `<div class="overflow-x-auto my-6 not-prose">\n<table class="w-full border-collapse border border-[#e8ece9] rounded-xl text-xs sm:text-sm text-left">\n  <thead>\n    <tr class="bg-[#f8faf9] text-[#101313] font-semibold">\n`;
    for (let c = 1; c <= tableCols; c++) {
      tableHtml += `      <th class="border border-[#e8ece9] p-3">${c === 1 ? "Feature / Spec" : `Option ${c - 1}`}</th>\n`;
    }
    tableHtml += `    </tr>\n  </thead>\n  <tbody class="divide-y divide-[#e8ece9]">\n`;

    for (let r = 1; r <= tableRows; r++) {
      const rowBg = tableZebra && r % 2 === 0 ? "bg-[#f8faf9]/50" : "bg-white";
      tableHtml += `    <tr class="${rowBg} hover:bg-[#f8faf9] transition">\n`;
      for (let c = 1; c <= tableCols; c++) {
        tableHtml += `      <td class="border border-[#e8ece9] p-3 text-[#596579]">${c === 1 ? `Metric ${r}` : `Value ${r}`}</td>\n`;
      }
      tableHtml += `    </tr>\n`;
    }
    tableHtml += `  </tbody>\n</table>\n</div>\n<p></p>`;

    insertCustomHtml(tableHtml);
    setShowTableModal(false);
  }

  // Code Block Insertion
  function handleInsertCodeBlock() {
    if (!codeContent.trim()) return;
    const escaped = codeContent
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const codeHtml = `
<div class="my-6 rounded-xl overflow-hidden border border-[#2d3748] bg-[#1a202c] shadow-md not-prose">
  <div class="px-4 py-2 bg-[#2d3748] text-[11px] font-mono font-bold text-emerald-400 flex items-center justify-between border-b border-[#4a5568]">
    <span>${codeLang.toUpperCase()}</span>
    <span class="text-xs text-gray-400 font-normal">Snippet</span>
  </div>
  <pre class="p-4 overflow-x-auto text-xs text-gray-100 font-mono leading-relaxed"><code class="language-${codeLang}">${escaped}</code></pre>
</div>
<p></p>`;

    insertCustomHtml(codeHtml);
    setShowCodeModal(false);
    setCodeContent("");
  }

  // Callout Box Insertion
  function handleInsertCallout() {
    const config = {
      tip: {
        bg: "bg-[#f4fbf7]",
        border: "border-[#078a4b]/30",
        text: "text-[#078a4b]",
        badge: "💡 Editorial Tip",
      },
      info: {
        bg: "bg-sky-50",
        border: "border-sky-200",
        text: "text-sky-800",
        badge: "ℹ️ Key Information",
      },
      warning: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
        badge: "⚠️ Benchmark Note",
      },
      alert: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-800",
        badge: "⚡ Key Takeaway",
      },
    }[calloutType];

    const titleHtml = calloutTitle.trim() ? `<h4 class="font-bold text-sm mb-1 ${config.text}">${calloutTitle.trim()}</h4>` : "";
    const bodyHtml = calloutContent.trim() ? `<p class="text-xs sm:text-sm text-[#596579]">${calloutContent.trim()}</p>` : "<p>Enter callout content here...</p>";

    const calloutHtml = `
<div class="my-6 p-4 rounded-xl border ${config.bg} ${config.border} not-prose">
  <div class="text-[11px] font-bold uppercase tracking-wider ${config.text} mb-1.5">${config.badge}</div>
  ${titleHtml}
  ${bodyHtml}
</div>
<p></p>`;

    insertCustomHtml(calloutHtml);
    setShowCalloutModal(false);
    setCalloutTitle("");
    setCalloutContent("");
  }

  // Video Embed Insertion
  function handleInsertVideo() {
    if (!videoUrl.trim()) return;
    let embedUrl = videoUrl.trim();
    if (embedUrl.includes("watch?v=")) {
      embedUrl = embedUrl.replace("watch?v=", "embed/");
    } else if (embedUrl.includes("youtu.be/")) {
      const id = embedUrl.split("youtu.be/")[1]?.split("?")[0];
      embedUrl = `https://www.youtube.com/embed/${id}`;
    }

    const videoHtml = `
<div class="my-6 aspect-video w-full rounded-2xl overflow-hidden border border-[#e8ece9] shadow-xs not-prose">
  <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="Video presentation"></iframe>
</div>
<p></p>`;

    insertCustomHtml(videoHtml);
    setShowVideoModal(false);
    setVideoUrl("");
  }

  // Canvas Click Detection for Links and Images (Micro Floating Toolbars)
  function handleEditorClick(e: React.MouseEvent | React.KeyboardEvent) {
    const target = e.target as HTMLElement;

    // 1. Detect Link Click
    const anchor = target.closest("a");
    if (anchor && visualEditorRef.current?.contains(anchor)) {
      const rect = anchor.getBoundingClientRect();
      const editorRect = visualEditorRef.current.getBoundingClientRect();
      setFloatingLink({
        href: anchor.getAttribute("href") || "",
        text: anchor.innerText || "",
        rect: {
          top: rect.bottom - editorRect.top + 8,
          left: Math.max(0, rect.left - editorRect.left),
        },
        element: anchor as HTMLAnchorElement,
      });
      setFloatingImage(null);
      return;
    }
    setFloatingLink(null);

    // 2. Detect Image Click
    const img = target.closest("img");
    if (img && visualEditorRef.current?.contains(img)) {
      const rect = img.getBoundingClientRect();
      const editorRect = visualEditorRef.current.getBoundingClientRect();
      const figure = (img.closest("figure") || img) as HTMLElement;
      setFloatingImage({
        src: img.src,
        alt: img.alt || "",
        rect: {
          top: rect.bottom - editorRect.top + 8,
          left: Math.max(0, rect.left - editorRect.left),
        },
        element: figure,
      });
      return;
    }
    setFloatingImage(null);
  }

  // Tags Handler
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

  // Featured Image Upload to Cloudinary
  async function handleFeaturedImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
        headers: getEditorHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to upload image");

      setFeaturedImageUrl(data.url);
      if (!featuredImageAlt) setFeaturedImageAlt(file.name.replace(/\.[^/.]+$/, ""));
      setFeedback({ type: "success", message: "Featured image uploaded to Cloudinary successfully!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Upload failed" });
    } finally {
      setUploadingImage(false);
    }
  }

  // Content Analytics Calculation
  const plainText = contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const charCount = plainText.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 225));
  const h2Count = (contentHtml.match(/<h2/gi) || []).length;
  const h3Count = (contentHtml.match(/<h3/gi) || []).length;

  // SEO Scorecard (out of 100)
  const seoChecklist = [
    { label: "Title length between 30 and 70 characters", pass: title.length >= 30 && title.length <= 70, weight: 15 },
    { label: "URL slug defined & lowercase", pass: Boolean(slug && slug === slug.toLowerCase() && !slug.includes(" ")), weight: 15 },
    { label: "Meta description 130–160 chars", pass: metaDescription.length >= 130 && metaDescription.length <= 160, weight: 20 },
    { label: "Content has 300+ words", pass: wordCount >= 300, weight: 20 },
    { label: "Headings (H2) used to structure text", pass: h2Count >= 1, weight: 15 },
    { label: "Featured image with Alt text provided", pass: Boolean(featuredImageUrl && featuredImageAlt), weight: 15 },
  ];
  const seoScore = seoChecklist.reduce((acc, item) => (item.pass ? acc + item.weight : acc), 0);

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
      author_name: authorName,
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
        headers: getEditorHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to save article");

      // Clear local draft upon successful save
      try {
        localStorage.removeItem(storageKey);
        setHasLocalDraft(false);
      } catch {
        // ignore
      }

      setFeedback({
        type: "success",
        message: targetStatus === "published" ? "Article published successfully to live blog!" : "Draft saved successfully!",
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
    if (!confirm("Are you sure you want to permanently delete this article? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/v1/posts/${initialData.id}`, {
        method: "DELETE",
        headers: getEditorHeaders(),
      });

      if (!res.ok) throw new Error("Failed to delete article");
      router.push("/admin/posts");
      router.refresh();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete" });
    }
  }

  // Export / Download article as Markdown (.md) with YAML Frontmatter
  function handleDownloadMarkdown() {
    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
slug: "${slug}"
status: "${status}"
author: "${authorName}"
date: "${new Date().toISOString()}"
excerpt: "${(excerpt || "").replace(/"/g, '\\"')}"
meta_description: "${(metaDescription || "").replace(/"/g, '\\"')}"
tags: [${tags.map((t) => `"${t}"`).join(", ")}]
faq:
${faq.map((f) => `  - question: "${f.question.replace(/"/g, '\\"')}"\n    answer: "${f.answer.replace(/"/g, '\\"')}"`).join("\n")}
---

# ${title}

${contentHtml}
`;
    const blob = new Blob([frontmatter], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "article"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback({ type: "success", message: `Article exported as ${slug || "article"}.md` });
  }

  function handleCopyMarkdown() {
    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
slug: "${slug}"
status: "${status}"
author: "${authorName}"
tags: [${tags.map((t) => `"${t}"`).join(", ")}]
---

# ${title}

${contentHtml}
`;
    navigator.clipboard.writeText(frontmatter);
    setFeedback({ type: "success", message: "Article Markdown copied to clipboard!" });
  }

  return (
    <div className={`font-sans ${isFullscreen ? "fixed inset-0 z-50 bg-[#F7F9F8] overflow-y-auto flex flex-col" : "space-y-6"}`}>
      {/* Top Header & Publishing Control Bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6EBE8] bg-white p-4 ${isFullscreen ? "sticky top-0 z-40 shadow-xs px-6" : "rounded-2xl shadow-2xs"}`}>
        <div className="flex items-center gap-3">
          {isFullscreen ? (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-[#101313] hover:bg-[#EAF8F0] hover:text-[#078a4b] transition flex items-center gap-1.5 text-xs font-bold"
              title="Exit Fullscreen Mode"
            >
              <Minimize className="w-4 h-4 text-[#078a4b]" />
              <span>Exit Zen Mode</span>
            </button>
          ) : (
            <Link
              href="/admin/posts"
              className="p-2 rounded-xl bg-white border border-[#E6EBE8] text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#101313] flex items-center gap-2">
              <span>{isEdit ? "Edit Article" : "Write Article"}</span>
              {isFullscreen && (
                <span className="px-2 py-0.5 rounded-full bg-[#EAF8F0] text-[#078a4b] text-[10px] font-bold uppercase tracking-wider">
                  Zen Focus
                </span>
              )}
            </h1>
            <div className="flex items-center gap-3 text-xs text-[#667085] mt-0.5">
              <span>
                Status: <strong className="font-semibold text-[#101313] capitalize">{status}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#078a4b]" />
                {lastAutosaved ? `Autosaved at ${lastAutosaved}` : "Autosave active (every 10s)"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasLocalDraft && (
            <button
              type="button"
              onClick={restoreLocalDraft}
              className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Local Draft</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl border border-[#E6EBE8] text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Focus Mode (Ctrl+Shift+F)"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Delete Article"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {isEdit && slug && (
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-white hover:bg-[#F8FAF9] text-[#667085] hover:text-[#101313] text-xs font-semibold border border-[#E6EBE8] transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Live</span>
            </a>
          )}

          {/* Export Markdown (.md) */}
          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#F8FAF9] text-[#101313] text-xs font-semibold border border-[#E6EBE8] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Download article as Markdown (.md) with YAML frontmatter"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>Export .md</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSave("draft")}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#F8FAF9] text-[#101313] font-semibold text-xs border border-[#E6EBE8] transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Save Draft (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5 text-[#667085]" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSave("published")}
            className="px-4 py-2 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Publish Article</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-2.5 text-xs ${
            isFullscreen ? "mx-6 my-2" : ""
          } ${
            feedback.type === "success"
              ? "bg-[#EAF8F0] border-[#d1edd9] text-[#078a4b]"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#078a4b]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[#8a9099] hover:text-black">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Editor & Right Meta Sidebar */}
      <div className={`${isFullscreen ? "max-w-5xl mx-auto w-full px-6 py-4 flex-1" : "grid grid-cols-1 lg:grid-cols-12 gap-6"}`}>
        {/* Left Column (8 cols or full width in Zen Mode): Title, Mode Switcher, Enterprise Toolbar, Canvas */}
        <div className={`${isFullscreen ? "w-full space-y-6" : "lg:col-span-8 space-y-6"}`}>
          {/* Title & URL Slug Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#101313]">Article Title *</label>
                <span
                  className={`text-[11px] font-mono ${
                    title.length > 70 ? "text-amber-600 font-semibold" : "text-[#8a9099]"
                  }`}
                >
                  {title.length} / 70 characters
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Why Small Language Models (SLMs) Are Winning in Production"
                className="w-full px-4 py-3 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-base sm:text-lg font-bold text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#078a4b] focus:bg-white transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#101313]">Permalink / URL Slug *</label>
                <button
                  type="button"
                  onClick={() => setAutoSlug(!autoSlug)}
                  className="text-[11px] text-[#667085] hover:text-[#101313] flex items-center gap-1 cursor-pointer"
                >
                  {autoSlug ? <Lock className="w-3 h-3 text-[#078a4b]" /> : <Unlock className="w-3 h-3 text-amber-600" />}
                  <span>{autoSlug ? "Synced with title" : "Manual slug"}</span>
                </button>
              </div>
              <div className="flex items-center rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] px-3.5 py-2">
                <span className="text-xs text-[#8a9099] font-mono">stackyup.com/</span>
                <input
                  type="text"
                  value={slug}
                  disabled={autoSlug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-slug-url"
                  className="w-full bg-transparent text-xs font-mono text-[#101313] focus:outline-none disabled:opacity-75"
                />
              </div>
            </div>
          </div>

          {/* Enterprise Editor Box */}
          <div className="rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs overflow-visible relative">
            {/* Top Editor Tab Bar: Visual (Compose) | HTML Source | Device Preview */}
            <div className="px-4 py-3 bg-[#F8FAF9] border-b border-[#E6EBE8] flex flex-wrap items-center justify-between gap-3 rounded-t-2xl">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewMode("visual")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === "visual"
                      ? "bg-white text-[#078a4b] shadow-2xs border border-[#E6EBE8]"
                      : "text-[#667085] hover:text-[#101313]"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Visual (WYSIWYG)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("html")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === "html"
                      ? "bg-white text-[#078a4b] shadow-2xs border border-[#E6EBE8]"
                      : "text-[#667085] hover:text-[#101313]"
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>HTML Source</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === "preview"
                      ? "bg-white text-[#078a4b] shadow-2xs border border-[#E6EBE8]"
                      : "text-[#667085] hover:text-[#101313]"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Reader Preview</span>
                </button>
              </div>

              {/* Word, Character & Reading Count Pill */}
              <div className="flex items-center gap-2 text-xs text-[#667085] font-mono">
                <span className="bg-white px-2.5 py-1 rounded-md border border-[#E6EBE8]" title="Total Words">
                  {wordCount.toLocaleString()} words
                </span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-[#E6EBE8]" title="Total Characters">
                  {charCount.toLocaleString()} chars
                </span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-[#E6EBE8]" title="Estimated Reading Time">
                  {readingTimeMinutes} min read
                </span>
              </div>
            </div>

            {/* Enterprise WordPress/Blogger STICKY Toolbar */}
            {viewMode === "visual" && (
              <div className="sticky top-0 z-30 p-2.5 bg-white/95 backdrop-blur-md border-b border-[#E6EBE8] flex flex-wrap items-center gap-1 text-xs shadow-2xs">
                {/* 1. History: Undo / Redo */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => execCmd("undo")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("redo")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-4 w-px bg-[#E6EBE8] mx-1" />

                {/* 2. Block Formatting Dropdown (Paragraph, H1, H2, H3, H4, Quote) */}
                <select
                  onChange={(e) => {
                    const tag = e.target.value;
                    if (tag) {
                      execCmd("formatBlock", `<${tag}>`);
                      e.target.value = "";
                    }
                  }}
                  defaultValue=""
                  className="px-2 py-1 bg-[#F8FAF9] border border-[#E6EBE8] rounded-lg text-xs font-semibold text-[#101313] focus:outline-none focus:border-[#078a4b]"
                  title="Heading / Block Format"
                >
                  <option value="" disabled>Headings...</option>
                  <option value="p">Paragraph (Normal Text)</option>
                  <option value="h1">Heading 1 (Main Section)</option>
                  <option value="h2">Heading 2 (H2 Subsection)</option>
                  <option value="h3">Heading 3 (H3 Topic)</option>
                  <option value="h4">Heading 4 (H4 Detail)</option>
                  <option value="blockquote">Quote Block</option>
                  <option value="pre">Preformatted Monospace</option>
                </select>

                <div className="h-4 w-px bg-[#E6EBE8] mx-1" />

                {/* 3. Inline Typography: Bold, Italic, Underline, Strikethrough */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => execCmd("bold")}
                    className="p-1.5 rounded-lg text-[#101313] hover:bg-[#F8FAF9] transition font-bold"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("italic")}
                    className="p-1.5 rounded-lg text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("underline")}
                    className="p-1.5 rounded-lg text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("strikeThrough")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("subscript")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition text-[11px] font-bold"
                    title="Subscript"
                  >
                    <Subscript className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("superscript")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition text-[11px] font-bold"
                    title="Superscript"
                  >
                    <Superscript className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-4 w-px bg-[#E6EBE8] mx-1" />

                {/* 4. Color & Highlight Pickers */}
                <div className="relative flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setShowColorDropdown(showColorDropdown === "text" ? null : "text")}
                    className="p-1.5 rounded-lg text-[#101313] hover:bg-[#F8FAF9] transition flex items-center gap-0.5"
                    title="Text Color"
                  >
                    <Palette className="w-4 h-4 text-[#078a4b]" />
                    <ChevronDown className="w-2.5 h-2.5 text-[#667085]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowColorDropdown(showColorDropdown === "highlight" ? null : "highlight")}
                    className="p-1.5 rounded-lg text-[#101313] hover:bg-[#F8FAF9] transition flex items-center gap-0.5"
                    title="Highlight Background"
                  >
                    <Highlighter className="w-4 h-4 text-amber-500" />
                    <ChevronDown className="w-2.5 h-2.5 text-[#667085]" />
                  </button>

                  {/* Text Color Dropdown */}
                  {showColorDropdown === "text" && (
                    <div className="absolute top-full left-0 mt-1 z-40 bg-white rounded-xl shadow-lg border border-[#E6EBE8] p-2 w-48 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-[#667085] px-2 py-0.5">Text Color</div>
                      {TEXT_COLORS.map((tc) => (
                        <button
                          key={tc.color}
                          type="button"
                          onClick={() => {
                            execCmd("foreColor", tc.color);
                            setShowColorDropdown(null);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F8FAF9] text-left text-xs transition"
                        >
                          <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: tc.color }} />
                          <span className="text-[#101313] font-medium">{tc.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Highlight Color Dropdown */}
                  {showColorDropdown === "highlight" && (
                    <div className="absolute top-full left-8 mt-1 z-40 bg-white rounded-xl shadow-lg border border-[#E6EBE8] p-2 w-48 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-[#667085] px-2 py-0.5">Highlight Background</div>
                      {HIGHLIGHT_COLORS.map((hc) => (
                        <button
                          key={hc.color}
                          type="button"
                          onClick={() => {
                            execCmd("hiliteColor", hc.color);
                            setShowColorDropdown(null);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F8FAF9] text-left text-xs transition"
                        >
                          <span className="w-3.5 h-3.5 rounded-md border border-gray-300" style={{ backgroundColor: hc.color }} />
                          <span className="text-[#101313] font-medium">{hc.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-4 w-px bg-[#E6EBE8] mx-1" />

                {/* 5. Alignments */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => execCmd("justifyLeft")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Align Left"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("justifyCenter")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Align Center"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("justifyRight")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Align Right"
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("justifyFull")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Justify"
                  >
                    <AlignJustify className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-4 w-px bg-[#E6EBE8] mx-1" />

                {/* 6. Lists, Quotes & Indentation */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => execCmd("insertUnorderedList")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("insertOrderedList")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("indent")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Increase Indent"
                  >
                    <Indent className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("outdent")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Decrease Indent"
                  >
                    <Outdent className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("formatBlock", "<blockquote>")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Blockquote"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-4 w-px bg-[#E6EBE8] mx-1" />

                {/* 7. Rich Component Insertion Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      saveSelection();
                      const sel = window.getSelection();
                      if (sel) setLinkText(sel.toString());
                      setShowLinkModal(true);
                    }}
                    className="px-2 py-1 rounded-lg text-[#078a4b] hover:bg-[#f4fbf7] border border-[#d1edd9] transition flex items-center gap-1 font-semibold"
                    title="Insert / Edit Link (Ctrl+K)"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      saveSelection();
                      setShowImageModal(true);
                    }}
                    className="px-2 py-1 rounded-lg text-[#101313] hover:bg-[#F8FAF9] border border-[#E6EBE8] transition flex items-center gap-1 font-medium"
                    title="Insert Image"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#078a4b]" />
                    <span>Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      saveSelection();
                      setShowTableModal(true);
                    }}
                    className="px-2 py-1 rounded-lg text-[#101313] hover:bg-[#F8FAF9] border border-[#E6EBE8] transition flex items-center gap-1 font-medium"
                    title="Insert Comparison Table"
                  >
                    <TableIcon className="w-3.5 h-3.5 text-sky-600" />
                    <span>Table</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      saveSelection();
                      setShowCodeModal(true);
                    }}
                    className="px-2 py-1 rounded-lg text-[#101313] hover:bg-[#F8FAF9] border border-[#E6EBE8] transition flex items-center gap-1 font-medium"
                    title="Insert Code Snippet"
                  >
                    <Braces className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      saveSelection();
                      setShowCalloutModal(true);
                    }}
                    className="px-2 py-1 rounded-lg text-[#101313] hover:bg-[#F8FAF9] border border-[#E6EBE8] transition flex items-center gap-1 font-medium"
                    title="Insert Editorial Callout Box"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Callout</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      saveSelection();
                      setShowVideoModal(true);
                    }}
                    className="px-2 py-1 rounded-lg text-[#101313] hover:bg-[#F8FAF9] border border-[#E6EBE8] transition flex items-center gap-1 font-medium"
                    title="Insert YouTube Video"
                  >
                    <Video className="w-3.5 h-3.5 text-red-600" />
                    <span>Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => insertCustomHtml("<hr class='my-8 border-t border-[#e8ece9]' /><p></p>")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] transition"
                    title="Horizontal Divider"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => execCmd("removeFormat")}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Clear Formatting"
                  >
                    <RemoveFormatting className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-4 w-px bg-[#E6EBE8] mx-1" />

                {/* 8. Plain Text Paste Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setPasteAsPlainText(!pasteAsPlainText)}
                  className={`px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                    pasteAsPlainText
                      ? "bg-amber-50 border-amber-300 text-amber-800"
                      : "bg-[#F8FAF9] border-[#E6EBE8] text-[#667085] hover:text-[#101313]"
                  }`}
                  title="Toggle 'Paste as Plain Text' (Strips all Microsoft Word and external HTML junk)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Plain Paste: {pasteAsPlainText ? "ON" : "OFF"}</span>
                </button>
              </div>
            )}

            {/* HTML Source Mode Bar */}
            {viewMode === "html" && (
              <div className="p-2.5 bg-[#F8FAF9] border-b border-[#E6EBE8] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase text-[#667085]">Quick Tags:</span>
                  <button
                    type="button"
                    onClick={() => insertCustomHtml("<p>Paragraph</p>")}
                    className="px-2 py-1 rounded bg-white border border-[#E6EBE8] text-[#101313] font-mono text-[11px] hover:border-[#078a4b]"
                  >
                    &lt;p&gt;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertCustomHtml("<h2>Heading 2</h2>")}
                    className="px-2 py-1 rounded bg-white border border-[#E6EBE8] text-[#101313] font-mono text-[11px] hover:border-[#078a4b]"
                  >
                    &lt;h2&gt;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertCustomHtml("<h3>Heading 3</h3>")}
                    className="px-2 py-1 rounded bg-white border border-[#E6EBE8] text-[#101313] font-mono text-[11px] hover:border-[#078a4b]"
                  >
                    &lt;h3&gt;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertCustomHtml("<blockquote>Quote text</blockquote>")}
                    className="px-2 py-1 rounded bg-white border border-[#E6EBE8] text-[#101313] font-mono text-[11px] hover:border-[#078a4b]"
                  >
                    &lt;blockquote&gt;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertCustomHtml("<pre><code>// code here</code></pre>")}
                    className="px-2 py-1 rounded bg-white border border-[#E6EBE8] text-[#101313] font-mono text-[11px] hover:border-[#078a4b]"
                  >
                    &lt;pre&gt;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertCustomHtml("<a href='https://' target='_blank' rel='noopener noreferrer'>Link text</a>")}
                    className="px-2 py-1 rounded bg-white border border-[#E6EBE8] text-[#101313] font-mono text-[11px] hover:border-[#078a4b]"
                  >
                    &lt;a&gt;
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setContentHtml(beautifyHtml(contentHtml))}
                  className="px-3 py-1 rounded-lg bg-white border border-[#E6EBE8] text-[#078a4b] hover:bg-[#EAF8F0] font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Automatically format and indent raw HTML code"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Beautify / Format HTML</span>
                </button>
              </div>
            )}

            {/* Editable Content Canvas */}
            <div className="p-6 min-h-[520px] relative">
              {/* Visual Mode (WYSIWYG contentEditable) */}
              {viewMode === "visual" && (
                <div className="relative">
                  {/* Floating Link Tooltip */}
                  {floatingLink && (
                    <div
                      className="absolute z-40 bg-[#101313] text-white text-xs px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2 border border-gray-700 font-sans animate-in fade-in"
                      style={{ top: `${floatingLink.rect.top}px`, left: `${floatingLink.rect.left}px` }}
                    >
                      <a
                        href={floatingLink.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 underline font-mono text-[11px] max-w-[200px] truncate"
                        title={floatingLink.href}
                      >
                        {floatingLink.href}
                      </a>
                      <a
                        href={floatingLink.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-emerald-400 p-0.5"
                        title="Open link in new tab"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setLinkUrl(floatingLink.href);
                          setLinkText(floatingLink.text);
                          setShowLinkModal(true);
                        }}
                        className="hover:text-emerald-400 p-0.5 font-bold"
                        title="Edit Link"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={handleUnlinkActive}
                        className="hover:text-rose-400 p-0.5"
                        title="Remove link"
                      >
                        <Unlink className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFloatingLink(null)}
                        className="text-gray-400 hover:text-white p-0.5"
                        title="Close tooltip"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Floating Image Micro-Toolbar */}
                  {floatingImage && (
                    <div
                      className="absolute z-40 bg-[#101313] text-white text-xs px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2 border border-gray-700 font-sans animate-in fade-in"
                      style={{ top: `${floatingImage.rect.top}px`, left: `${floatingImage.rect.left}px` }}
                    >
                      <span className="text-[10px] uppercase font-bold text-gray-400">Align:</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateImageAlignment("left")}
                        className="p-1 hover:text-emerald-400"
                        title="Align Left (Float text)"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateImageAlignment("center")}
                        className="p-1 hover:text-emerald-400"
                        title="Align Center (Block)"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateImageAlignment("right")}
                        className="p-1 hover:text-emerald-400"
                        title="Align Right (Float text)"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateImageAlignment("full")}
                        className="p-1 hover:text-emerald-400 text-[10px] font-bold"
                        title="Full Width"
                      >
                        100%
                      </button>
                      <div className="h-3 w-px bg-gray-700 mx-0.5" />
                      <button
                        type="button"
                        onClick={handleDeleteActiveImage}
                        className="p-1 text-rose-400 hover:text-rose-300"
                        title="Delete Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFloatingImage(null)}
                        className="text-gray-400 hover:text-white p-0.5"
                        title="Close tooltip"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div
                    ref={visualEditorRef}
                    contentEditable
                    onInput={handleVisualInput}
                    onPaste={handlePaste}
                    onClick={handleEditorClick}
                    onKeyUp={handleEditorClick}
                    className="outline-none min-h-[460px] article-prose medium-prose max-w-none text-[#101313] font-sans leading-relaxed text-base focus:ring-0 selection:bg-[#078a4b]/20"
                    style={{ wordBreak: "break-word" }}
                    data-placeholder="Start writing your article here..."
                  />
                </div>
              )}

              {/* HTML Mode (Source Code Textarea) */}
              {viewMode === "html" && (
                <textarea
                  id="content-editor"
                  rows={24}
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  placeholder="<p>Write your article content using clean HTML tags...</p>"
                  className="w-full p-4 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] font-mono text-xs text-[#101313] focus:outline-none focus:border-[#078a4b] focus:bg-white leading-relaxed transition"
                />
              )}

              {/* Reader Preview Mode with Device Frames */}
              {viewMode === "preview" && (
                <div className="space-y-4">
                  {/* Device selector bar */}
                  <div className="flex items-center justify-center gap-2 pb-4 border-b border-[#E6EBE8]">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        previewDevice === "desktop"
                          ? "bg-[#101313] text-white"
                          : "bg-[#F8FAF9] border border-[#E6EBE8] text-[#667085]"
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Desktop (100%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("tablet")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        previewDevice === "tablet"
                          ? "bg-[#101313] text-white"
                          : "bg-[#F8FAF9] border border-[#E6EBE8] text-[#667085]"
                      }`}
                    >
                      <Tablet className="w-3.5 h-3.5" />
                      <span>Tablet (768px)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        previewDevice === "mobile"
                          ? "bg-[#101313] text-white"
                          : "bg-[#F8FAF9] border border-[#E6EBE8] text-[#667085]"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Mobile (390px)</span>
                    </button>
                  </div>

                  {/* Device Container Preview */}
                  <div className="flex justify-center bg-[#F8FAF9] p-4 sm:p-8 rounded-2xl overflow-x-auto">
                    <div
                      className={`bg-white rounded-2xl border border-[#E6EBE8] p-6 sm:p-10 shadow-sm transition-all duration-300 ${
                        previewDevice === "desktop"
                          ? "w-full max-w-3xl"
                          : previewDevice === "tablet"
                          ? "w-[768px]"
                          : "w-[390px]"
                      }`}
                    >
                      {/* Simulated Article Header */}
                      <div className="space-y-4 pb-6 border-b border-[#E6EBE8]">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4fbf7] text-[#078a4b] text-xs font-semibold uppercase tracking-wider">
                          <span>{tags[0] || "Review"}</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101313] font-sans">
                          {title || "Untitled Article Title"}
                        </h1>
                        <div className="flex items-center gap-3 text-xs text-[#667085]">
                          <span>By {authorName}</span>
                          <span>•</span>
                          <span>{readingTimeMinutes} min read</span>
                          <span>•</span>
                          <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>

                      {/* Featured image if set */}
                      {featuredImageUrl && (
                        <div className="my-6 rounded-xl overflow-hidden border border-[#E6EBE8]">
                          <img
                            src={featuredImageUrl}
                            alt={featuredImageAlt || title}
                            className="w-full max-h-[400px] object-cover"
                          />
                        </div>
                      )}

                      {/* Article Body */}
                      <div
                        className="article-prose medium-prose max-w-none text-[#101313] font-sans leading-relaxed text-base pt-4"
                        dangerouslySetInnerHTML={{
                          __html: contentHtml || "<p class='italic text-[#8a9099]'>Your article content will appear here...</p>",
                        }}
                      />

                      {/* FAQ Section preview */}
                      {faq.length > 0 && (
                        <div className="mt-12 pt-8 border-t border-[#E6EBE8] space-y-4">
                          <h3 className="text-lg font-bold text-[#101313]">Frequently Asked Questions</h3>
                          <div className="space-y-3">
                            {faq.map((item, idx) => (
                              <div key={idx} className="p-4 rounded-xl border border-[#E6EBE8] bg-[#F8FAF9]">
                                <h4 className="font-semibold text-sm text-[#101313] mb-1">{item.question}</h4>
                                <p className="text-xs text-[#596579]">{item.answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Structured FAQ Schema Builder */}
          <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#101313] flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#078a4b]" />
                  <span>FAQ Schema Builder (Google FAQPage JSON-LD)</span>
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Frequently Asked Questions generate rich expandable question cards in Google search results.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddFaq}
                className="px-3 py-1.5 rounded-lg bg-[#EAF8F0] hover:bg-[#d5f2e1] text-[#078a4b] font-semibold text-xs border border-[#c1e8d0] transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ Item</span>
              </button>
            </div>

            {faq.length === 0 ? (
              <p className="text-xs text-[#8a9099] italic p-4 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-center">
                No FAQ items yet. Click &quot;Add FAQ Item&quot; to add structured Q&amp;A pairs for Google search snippets.
              </p>
            ) : (
              <div className="space-y-3">
                {faq.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] space-y-2 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(idx)}
                      className="absolute top-3 right-3 text-[#8a9099] hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <input
                        type="text"
                        value={item.question}
                        onChange={(e) => handleUpdateFaq(idx, "question", e.target.value)}
                        placeholder="Question (e.g. Is Claude 3.7 Sonnet better than GPT-4o for coding?)"
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#078a4b]"
                      />
                    </div>
                    <div>
                      <textarea
                        rows={2}
                        value={item.answer}
                        onChange={(e) => handleUpdateFaq(idx, "answer", e.target.value)}
                        placeholder="Detailed answer for search rich snippet..."
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#078a4b]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Settings, SEO, Featured Image, Scorecard (Hidden in Zen Mode) */}
        {!isFullscreen && (
          <div className="lg:col-span-4 space-y-6">
            {/* Status & Workflow Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
              <h3 className="text-xs font-semibold text-[#667085] uppercase tracking-wider">Publishing Status</h3>
              <div className="grid grid-cols-3 gap-2">
                {(["draft", "scheduled", "published"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition cursor-pointer ${
                      status === s
                        ? s === "published"
                          ? "bg-[#EAF8F0] text-[#078a4b] border-[#078a4b]"
                          : s === "scheduled"
                          ? "bg-sky-50 text-sky-700 border-sky-300"
                          : "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-[#F8FAF9] border-[#E6EBE8] text-[#667085] hover:text-[#101313]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {status === "scheduled" && (
                <div>
                  <label className="block text-xs font-semibold text-[#667085] mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>Scheduled Publish Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#078a4b]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#667085] mb-1">Author Attribution</label>
                <select
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#078a4b]"
                >
                  <option value="Adit">Adit (Lead Editor & Founder)</option>
                  <option value="StackYup Editorial Team">StackYup Editorial Team</option>
                  <option value="Guest Tech Reviewer">Guest Tech Reviewer</option>
                  <option value="Hermes AI Benchmark">Hermes AI Benchmark</option>
                  <option value="Muse AI Publisher">Muse AI Publisher</option>
                </select>
              </div>
            </div>

            {/* Featured Image Box */}
            <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
              <h3 className="text-xs font-semibold text-[#667085] uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#078a4b]" />
                  <span>Featured Image</span>
                </span>
                <span className="text-[10px] text-[#8a9099] font-normal">WebP 1200x630</span>
              </h3>

              {featuredImageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-[#E6EBE8] group">
                  <img
                    src={featuredImageUrl}
                    alt={featuredImageAlt || "Featured image"}
                    className="w-full h-36 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFeaturedImageUrl("")}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#E6EBE8] hover:border-[#078a4b] rounded-xl p-6 text-center cursor-pointer transition bg-[#F8FAF9]"
                >
                  <Upload className="w-6 h-6 text-[#8a9099] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[#101313]">Click to upload to Cloudinary</p>
                  <p className="text-[11px] text-[#667085] mt-1">PNG, JPG, or WebP up to 5MB</p>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFeaturedImageUpload}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />

              <div>
                <label className="block text-xs font-semibold text-[#667085] mb-1">Image URL</label>
                <input
                  type="text"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#078a4b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#667085] mb-1">
                  Alt Text (Mandatory for SEO) *
                </label>
                <input
                  type="text"
                  value={featuredImageAlt}
                  onChange={(e) => setFeaturedImageAlt(e.target.value)}
                  placeholder="Clear description of the image content"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#078a4b]"
                />
              </div>
            </div>

            {/* SEO & Live SERP Snippet Preview */}
            <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
              <h3 className="text-xs font-semibold text-[#667085] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Search Engine Optimization (SEO)</span>
              </h3>

              {/* Google SERP Preview Card */}
              <div className="p-3.5 rounded-xl bg-[#f8faf9] border border-[#E6EBE8] space-y-1">
                <div className="text-[11px] text-[#202124] flex items-center gap-1 font-sans">
                  <span className="w-4 h-4 rounded-full bg-[#078a4b] text-white flex items-center justify-center text-[9px] font-bold">S</span>
                  <span className="font-medium text-xs">StackYup</span>
                  <span className="text-[#5f6368]">https://stackyup.com/{slug || "slug"}</span>
                </div>
                <h4 className="text-sm font-medium text-[#1a0dab] line-clamp-1 hover:underline cursor-pointer">
                  {title || "Article Title Preview"} — StackYup
                </h4>
                <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                  {metaDescription || excerpt || "Write a captivating meta description to attract readers from Google Search..."}
                </p>
              </div>

              {/* Meta Description Counter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#667085]">Meta Description</label>
                  <span
                    className={`text-[10px] font-mono ${
                      metaDescription.length > 160
                        ? "text-rose-600 font-bold"
                        : metaDescription.length >= 130
                        ? "text-[#078a4b] font-bold"
                        : "text-[#8a9099]"
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
                  className="w-full p-2.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#078a4b]"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-semibold text-[#667085] mb-1">Article Excerpt</label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary displayed on homepage feed..."
                  className="w-full p-2.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#078a4b]"
                />
              </div>
            </div>

            {/* Real-time SEO Health Scorecard */}
            <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#667085] uppercase tracking-wider">SEO Quality Score</h3>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    seoScore >= 80
                      ? "bg-[#EAF8F0] text-[#078a4b]"
                      : seoScore >= 50
                      ? "bg-amber-50 text-amber-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {seoScore} / 100
                </span>
              </div>

              {/* Checklist */}
              <div className="space-y-2 pt-2 border-t border-[#E6EBE8]">
                {seoChecklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    {item.pass ? (
                      <Check className="w-3.5 h-3.5 text-[#078a4b] shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0 mt-0.5" />
                    )}
                    <span className={item.pass ? "text-[#101313]" : "text-[#8a9099]"}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories & Tags Box */}
            <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-3">
              <h3 className="text-xs font-semibold text-[#667085] uppercase tracking-wider">Primary Category &amp; Tags</h3>

              {/* Quick Category Selector */}
              <div className="flex flex-wrap gap-1.5 pb-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = tags.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setTags(tags.filter((t) => t !== cat));
                        } else {
                          setTags([...tags, cat]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                        isSelected
                          ? "bg-[#078a4b] text-white border-[#078a4b]"
                          : "bg-[#F8FAF9] border-[#E6EBE8] text-[#667085] hover:text-[#101313]"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#E6EBE8]">
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
                  placeholder="Add custom tag + Enter"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#078a4b]"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-xs font-semibold text-white transition cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F4F6F5] text-[#101313] text-xs border border-[#E6EBE8]"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-[#8a9099] hover:text-rose-600 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Insert / Edit Link */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
              <h3 className="text-sm font-bold text-[#101313] flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#078a4b]" />
                <span>Insert / Edit Hyperlink</span>
              </h3>
              <button onClick={() => setShowLinkModal(false)} className="text-[#8a9099] hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Destination URL *</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/guide"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Anchor Text (Optional)</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Read full technical benchmark"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-[#101313] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkNewTab}
                    onChange={(e) => setLinkNewTab(e.target.checked)}
                    className="rounded text-[#078a4b] focus:ring-0"
                  />
                  <span>Open link in a new tab (target=&quot;_blank&quot;)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#101313] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkNofollow}
                    onChange={(e) => setLinkNofollow(e.target.checked)}
                    className="rounded text-[#078a4b] focus:ring-0"
                  />
                  <span>Add rel=&quot;nofollow&quot; (for affiliate or sponsored links)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6EBE8]">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6EBE8] text-xs font-semibold text-[#667085] hover:bg-[#F8FAF9]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                disabled={!linkUrl}
                className="px-4 py-2 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-semibold disabled:opacity-50"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Insert Inline Image */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
              <h3 className="text-sm font-bold text-[#101313] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#078a4b]" />
                <span>Insert Article Image</span>
              </h3>
              <button onClick={() => setShowImageModal(false)} className="text-[#8a9099] hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Image URL *</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={inlineImageUrl}
                    onChange={(e) => setInlineImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or Cloudinary"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                  />
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => inlineImageInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl border border-[#E6EBE8] bg-[#F8FAF9] hover:bg-white text-xs font-semibold text-[#101313] flex items-center gap-1 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#078a4b]" />
                    <span>Upload</span>
                  </button>
                </div>
                <input
                  type="file"
                  ref={inlineImageInputRef}
                  onChange={handleInlineImageFileUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Alt Text (Accessibility) *</label>
                <input
                  type="text"
                  value={inlineImageAlt}
                  onChange={(e) => setInlineImageAlt(e.target.value)}
                  placeholder="Clear description of the visual scene"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Caption (Optional)</label>
                <input
                  type="text"
                  value={inlineImageCaption}
                  onChange={(e) => setInlineImageCaption(e.target.value)}
                  placeholder="e.g. Figure 1: Architecture diagram of SLM latency comparison"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Alignment</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "center", label: "Center" },
                    { id: "left", label: "Left Wrap" },
                    { id: "right", label: "Right Wrap" },
                    { id: "full", label: "Full" },
                  ].map((al) => (
                    <button
                      key={al.id}
                      type="button"
                      onClick={() => setInlineImageAlign(al.id as any)}
                      className={`py-1.5 text-xs font-semibold rounded-xl border transition ${
                        inlineImageAlign === al.id
                          ? "bg-[#EAF8F0] border-[#078a4b] text-[#078a4b]"
                          : "bg-[#F8FAF9] border-[#E6EBE8] text-[#667085]"
                      }`}
                    >
                      {al.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6EBE8]">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6EBE8] text-xs font-semibold text-[#667085] hover:bg-[#F8FAF9]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertInlineImage}
                disabled={!inlineImageUrl}
                className="px-4 py-2 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-semibold disabled:opacity-50"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Insert Comparison Table */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
              <h3 className="text-sm font-bold text-[#101313] flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-sky-600" />
                <span>Insert Comparison Table</span>
              </h3>
              <button onClick={() => setShowTableModal(false)} className="text-[#8a9099] hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">Rows (1-15)</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value) || 3)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">Columns (2-6)</label>
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value) || 3)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-[#101313] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={tableZebra}
                  onChange={(e) => setTableZebra(e.target.checked)}
                  className="rounded text-[#078a4b] focus:ring-0"
                />
                <span>Zebra stripe alternating row backgrounds</span>
              </label>

              <p className="text-xs text-[#667085]">
                Creates a clean, mobile-responsive table with styled borders and customizable cell text.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6EBE8]">
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6EBE8] text-xs font-semibold text-[#667085] hover:bg-[#F8FAF9]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertTable}
                className="px-4 py-2 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-semibold"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Insert Code Block with Syntax Tagging */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
              <h3 className="text-sm font-bold text-[#101313] flex items-center gap-2">
                <Braces className="w-4 h-4 text-emerald-600" />
                <span>Insert Formatted Code Snippet</span>
              </h3>
              <button onClick={() => setShowCodeModal(false)} className="text-[#8a9099] hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Language</label>
                <select
                  value={codeLang}
                  onChange={(e) => setCodeLang(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                >
                  {CODE_LANGUAGES.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Code Content *</label>
                <textarea
                  rows={8}
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder="// Paste or write your source code here..."
                  className="w-full p-3 rounded-xl bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs border border-[#333] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6EBE8]">
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6EBE8] text-xs font-semibold text-[#667085] hover:bg-[#F8FAF9]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertCodeBlock}
                disabled={!codeContent.trim()}
                className="px-4 py-2 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-semibold disabled:opacity-50"
              >
                Insert Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Insert Callout Box */}
      {showCalloutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
              <h3 className="text-sm font-bold text-[#101313] flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Insert Editorial Callout Box</span>
              </h3>
              <button onClick={() => setShowCalloutModal(false)} className="text-[#8a9099] hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Callout Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "tip", label: "💡 Tip / Recommendation" },
                    { id: "info", label: "ℹ️ Key Information" },
                    { id: "warning", label: "⚠️ Benchmark Warning" },
                    { id: "alert", label: "⚡ Key Takeaway" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCalloutType(t.id as any)}
                      className={`p-2 rounded-xl text-xs font-semibold border text-left transition ${
                        calloutType === t.id
                          ? "bg-[#EAF8F0] border-[#078a4b] text-[#078a4b]"
                          : "bg-[#F8FAF9] border-[#E6EBE8] text-[#667085]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Title (Optional)</label>
                <input
                  type="text"
                  value={calloutTitle}
                  onChange={(e) => setCalloutTitle(e.target.value)}
                  placeholder="e.g. Pro Tip for Self-Hosters"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Message Text</label>
                <textarea
                  rows={3}
                  value={calloutContent}
                  onChange={(e) => setCalloutContent(e.target.value)}
                  placeholder="Enter the callout explanation..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6EBE8]">
              <button
                type="button"
                onClick={() => setShowCalloutModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6EBE8] text-xs font-semibold text-[#667085] hover:bg-[#F8FAF9]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertCallout}
                className="px-4 py-2 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-semibold"
              >
                Insert Callout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Insert Video */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
              <h3 className="text-sm font-bold text-[#101313] flex items-center gap-2">
                <Video className="w-4 h-4 text-red-600" />
                <span>Embed YouTube Video</span>
              </h3>
              <button onClick={() => setShowVideoModal(false)} className="text-[#8a9099] hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Video URL *</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                />
              </div>
              <p className="text-xs text-[#667085]">
                Embeds a responsive 16:9 YouTube video player seamlessly into your article.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6EBE8]">
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6EBE8] text-xs font-semibold text-[#667085] hover:bg-[#F8FAF9]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertVideo}
                disabled={!videoUrl}
                className="px-4 py-2 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-semibold disabled:opacity-50"
              >
                Embed Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
