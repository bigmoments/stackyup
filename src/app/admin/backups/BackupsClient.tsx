"use client";

import { useState } from "react";
import { Database, Download, CheckCircle2, ShieldCheck, HardDrive, RefreshCw } from "lucide-react";

export default function BackupsClient({
  stats,
}: {
  stats: { posts: number; pages: number; media: number; comments: number };
}) {
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleDownloadBackup() {
    setDownloading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/backups");
      if (!res.ok) throw new Error("Failed to export backup");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stackyup-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Backup download error:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
          Data Integrity & Safety
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
          System Backups
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Generate complete database snapshots to guarantee zero data loss.
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Full database snapshot downloaded successfully.</span>
        </div>
      )}

      {/* Database Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Articles</span>
          <span className="text-2xl font-extrabold text-[#101313] block">{stats.posts}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Static Pages</span>
          <span className="text-2xl font-extrabold text-[#101313] block">{stats.pages}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Media Assets</span>
          <span className="text-2xl font-extrabold text-[#101313] block">{stats.media}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Comments</span>
          <span className="text-2xl font-extrabold text-[#101313] block">{stats.comments}</span>
        </div>
      </div>

      {/* Action Card */}
      <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF8F0] text-[#079653] flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#101313]">Download Full JSON Database Dump</h3>
            <p className="text-xs text-[#667085]">
              Includes all posts, pages, comments, media metadata, categories, tags, and settings in standard JSON format.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={downloading}
          onClick={handleDownloadBackup}
          className="px-5 py-2.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          {downloading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating Backup...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Full Backup Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
