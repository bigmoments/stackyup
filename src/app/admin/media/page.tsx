"use client";

import { useState, useEffect, useRef } from "react";
import { UploadCloud, Copy, Check, Trash2, Image as ImageIcon, ExternalLink, AlertCircle } from "lucide-react";

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
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [altInput, setAltInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    try {
      const res = await fetch("/api/v1/media?limit=50", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CMS_API_KEY || ""}`,
        },
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

    const formData = new FormData();
    formData.append("file", file);
    if (altInput.trim()) formData.append("alt", altInput.trim());

    try {
      const res = await fetch("/api/v1/media", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CMS_API_KEY || ""}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");

      setAltInput("");
      await loadMedia();
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  function handleCopy(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Media Library</h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload and manage your assets hosted on Cloudinary CDN (folder: <code>stackyup</code>)
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={altInput}
            onChange={(e) => setAltInput(e.target.value)}
            placeholder="Alt text for next upload (e.g. Workflow comparison chart)"
            className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload Image</span>
              </>
            )}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
          />
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Loading media assets...</div>
      ) : mediaList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No media uploaded yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Upload images here or upload via the Publishing API (<code className="text-indigo-400">POST /api/v1/media</code>).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaList.map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden flex flex-col justify-between group hover:border-slate-700 transition shadow-lg"
            >
              <div className="h-40 bg-slate-950/60 overflow-hidden relative flex items-center justify-center">
                <img
                  src={item.url}
                  alt={item.alt || item.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 text-slate-300 hover:text-white transition opacity-0 group-hover:opacity-100"
                  title="Open full size"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-3.5 space-y-2">
                <p className="text-xs font-semibold text-slate-200 truncate" title={item.filename}>
                  {item.filename}
                </p>
                {item.alt && (
                  <p className="text-[11px] text-slate-400 truncate italic">
                    &quot;{item.alt}&quot;
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.width && item.height ? `${item.width}×${item.height}` : "WebP"}
                    {item.sizeBytes ? ` • ${(item.sizeBytes / 1024).toFixed(0)} KB` : ""}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.url, item.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition flex items-center gap-1 cursor-pointer"
                    title="Copy Image URL"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
