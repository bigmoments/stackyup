"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  Sparkles,
} from "lucide-react";

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
    <div className="space-y-6 max-w-3xl font-sans">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
          Data Migration
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
          Blogger XML Importer
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Import articles, static pages, and tags directly from your Blogger export file (e.g. <code>StackYup.xml</code>)
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="p-6 rounded-2xl bg-[#EAF8F0] border border-[#c1e8d0] space-y-4">
          <div className="flex items-center gap-2.5 text-[#079653] font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-[#079653]" />
            <span>Blogger Import Finished Successfully!</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-[#E6EBE8]">
              <span className="text-[10px] uppercase font-bold text-[#667085]">Imported Posts</span>
              <p className="text-xl font-bold text-[#079653] mt-1">{result.importedPosts}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-[#E6EBE8]">
              <span className="text-[10px] uppercase font-bold text-[#667085]">Imported Pages</span>
              <p className="text-xl font-bold text-sky-600 mt-1">{result.importedPages}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-[#E6EBE8]">
              <span className="text-[10px] uppercase font-bold text-[#667085]">Skipped</span>
              <p className="text-xl font-bold text-[#101313] mt-1">{result.skipped}</p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/admin/posts"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-semibold text-xs transition shadow-xs"
            >
              <span>View Imported Articles</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Upload Box */}
      <div className="p-8 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-6">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#E6EBE8] hover:border-[#079653] rounded-2xl p-10 text-center cursor-pointer transition bg-[#F8FAF9]"
        >
          <UploadCloud className="w-12 h-12 text-[#8a9099] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#101313]">
            {selectedFile ? selectedFile.name : "Select your Blogger Export XML file"}
          </h3>
          <p className="text-xs text-[#667085] mt-1">
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-[#667085] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#079653]" />
            <span>Automatically extracts clean HTML, original slugs, tags, and timestamps.</span>
          </div>

          <button
            type="button"
            disabled={loading || !selectedFile}
            onClick={handleImport}
            className="px-6 py-2.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
