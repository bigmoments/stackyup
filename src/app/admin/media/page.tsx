"use client";

import { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  Copy,
  Check,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useDialog } from "@/components/ui/CustomDialog";

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  createdAt: string;
}

export default function AdminMediaPage() {
  const dialog = useDialog();
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [altInput, setAltInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (process.env.NEXT_PUBLIC_CMS_API_KEY) {
      headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_CMS_API_KEY}`;
    }
    return headers;
  }

  async function loadMedia() {
    try {
      const res = await fetch("/api/v1/media?limit=50", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setMediaList(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);
    if (altInput.trim()) formData.append("alt", altInput.trim());

    try {
      const res = await fetch("/api/v1/media", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");

      setAltInput("");
      setSuccess("Media uploaded successfully!");
      setTimeout(() => setSuccess(null), 3000);
      await loadMedia();
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(item: MediaItem) {
    const ok = await dialog.dangerConfirm(
      `Hapus File Media "${item.filename}"?`,
      "File media ini akan dihapus secara permanen dari server penyimpanan / CDN. Artikel yang memuat gambar ini mungkin rusak.",
      "Ya, Hapus Gambar"
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setMediaList((prev) => prev.filter((m) => m.id !== item.id));
        setSuccess(`Image "${item.filename}" deleted.`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        dialog.error("Gagal Menghapus", data.error?.message || "Gagal menghapus file media.");
      }
    } catch (err: any) {
      dialog.error("Gagal Menghapus", err.message || "Gagal menghubungi server.");
    }
  }

  function handleCopy(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleCopyShortcode(item: MediaItem) {
    const altText = item.alt || item.filename.replace(/\.[^/.]+$/, "");
    const shortcode = `[img id="${item.id}" alt="${altText}"]`;
    navigator.clipboard.writeText(shortcode);
    setCopiedId(`sc_${item.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
          Content Assets
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
          Media Library ({mediaList.length})
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Upload and manage your assets hosted on Cloudinary CDN or local filesystem.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-[#101313]">Upload New Media</h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Supports WebP, PNG, JPG, GIF, SVG up to 5MB.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Optional image alt text..."
              value={altInput}
              onChange={(e) => setAltInput(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653] w-full sm:w-64"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? "Uploading..." : "Select File"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#667085]">
          Loading media library assets...
        </div>
      ) : mediaList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-[#E6EBE8] text-center shadow-2xs">
          <ImageIcon className="w-10 h-10 text-[#8a9099] mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-[#101313]">No media assets uploaded</h3>
          <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
            Upload images here or upload via the Publishing API (<code className="text-[#079653]">POST /api/v1/media</code>).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaList.map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-white border border-[#E6EBE8] overflow-hidden flex flex-col justify-between group hover:border-[#079653] transition shadow-2xs"
            >
              <div className="h-40 bg-[#F8FAF9] overflow-hidden relative flex items-center justify-center border-b border-[#E6EBE8]">
                <img
                  src={item.url}
                  alt={item.alt || item.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-[#101313] hover:text-[#079653] transition opacity-0 group-hover:opacity-100 shadow-2xs"
                  title="Open full size"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-3.5 space-y-2">
                <p className="text-xs font-semibold text-[#101313] truncate" title={item.filename}>
                  {item.filename}
                </p>
                {item.alt && (
                  <p className="text-[11px] text-[#667085] truncate italic">
                    &quot;{item.alt}&quot;
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[#8a9099] font-mono">
                    {item.width && item.height ? `${item.width}×${item.height}` : "WebP"}
                    {item.sizeBytes ? ` • ${(item.sizeBytes / 1024).toFixed(0)} KB` : ""}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyShortcode(item)}
                      className="px-2 py-1.5 rounded-lg bg-[#F8FAF9] hover:bg-[#EAF8F0] text-[#667085] hover:text-[#079653] text-[11px] font-medium transition flex items-center gap-1 cursor-pointer border border-[#E6EBE8]"
                      title="Copy Shortcode: [img id=...]"
                    >
                      {copiedId === `sc_${item.id}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#079653]" />
                          <span className="text-[#079653] text-[10px] font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#079653]" />
                          <span className="text-[10px]">Shortcode</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(item.url, item.id)}
                      className="p-1.5 rounded-lg bg-[#F8FAF9] hover:bg-[#EAF8F0] text-[#667085] hover:text-[#079653] text-xs transition flex items-center gap-1 cursor-pointer border border-[#E6EBE8]"
                      title="Copy Direct Image URL"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-[#079653]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-lg bg-[#F8FAF9] hover:bg-rose-50 text-[#8a9099] hover:text-rose-600 text-xs transition flex items-center gap-1 cursor-pointer border border-[#E6EBE8]"
                      title="Delete Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
