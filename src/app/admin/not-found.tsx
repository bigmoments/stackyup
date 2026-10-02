import Link from "next/link";
import { LayoutDashboard, FileText, ArrowLeft, Search, HelpCircle, Settings } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-14 h-14 rounded-2xl bg-[#078a4b]/10 text-[#078a4b] flex items-center justify-center mb-5 border border-[#078a4b]/20">
        <HelpCircle className="w-7 h-7" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-[#078a4b] mb-2 font-mono">
        404 — Admin Resource Not Found
      </span>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101313] mb-3 font-sans">
        The requested admin page or resource doesn't exist.
      </h1>

      <p className="text-sm text-[#667085] max-w-md mx-auto mb-8 font-sans">
        The record, setting, or endpoint you are looking for may have been deleted, moved, or never created.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-semibold transition shadow-xs"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Admin Overview</span>
        </Link>
        <Link
          href="/admin/posts"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e8ece9] text-[#101313] text-xs font-semibold hover:bg-[#f8faf9] transition"
        >
          <FileText className="w-4 h-4 text-[#667085]" />
          <span>Manage Articles</span>
        </Link>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e8ece9] text-[#101313] text-xs font-semibold hover:bg-[#f8faf9] transition"
        >
          <Settings className="w-4 h-4 text-[#667085]" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
