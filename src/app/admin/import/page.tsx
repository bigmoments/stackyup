"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { UploadCloud, CheckCircle2, AlertCircle, FileText, ArrowRight, Sparkles } from "lucide-react";

interface ImportResult {
  importedPosts: number;
  importedPages: number;
  skipped: number;
  totalEntries: number;
}

export default function AdminBloggerImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
    }
  }

  async function handleImport() {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/admin/import-blogger", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Import failed");

      setResult({
        importedPosts: data.importedPosts || 0,
        importedPages: data.importedPages || 0,
        skipped: data.skipped || 0,
        totalEntries: data.totalEntries || 0,
      });
    } catch (err: any) {
      setError(err.message || "Failed to parse and import Blogger XML");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Blogger XML Importer</h1>
        <p className="text-xs text-slate-400 mt-1">
          Import articles, static pages, and tags directly from your Blogger export file (e.g. <code>StackYup.xml</code>)
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-300 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Blogger Import Finished Successfully!</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Imported Posts</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">{result.importedPosts}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Imported Pages</span>
              <p className="text-xl font-bold text-sky-400 mt-1">{result.importedPages}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Skipped (Dup/Comments)</span>
              <p className="text-xl font-bold text-slate-400 mt-1">{result.skipped}</p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/admin/posts"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
            >
              <span>View Imported Articles</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Upload Box */}
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-10 text-center cursor-pointer transition bg-slate-950/40"
        >
          <UploadCloud className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">
            {selectedFile ? selectedFile.name : "Select your Blogger Export XML file"}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {selectedFile
              ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to import`
              : "Drag & drop or click to choose StackYup.xml"}
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xml,text/xml"
          className="hidden"
        />

        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Automatically extracts clean HTML, original slugs, tags, and timestamps.</span>
          </div>

          <button
            type="button"
            disabled={loading || !selectedFile}
            onClick={handleImport}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Importing Articles...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Start Migration Import</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
