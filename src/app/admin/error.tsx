"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, LayoutDashboard, Activity, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showStack, setShowStack] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error("Admin Workspace Error:", error);
  }, [error]);

  function copyError() {
    const errorText = `Admin Error: ${error.message}\nDigest: ${error.digest || "N/A"}\nStack:\n${error.stack || "No stack trace available"}`;
    navigator.clipboard.writeText(errorText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 max-w-2xl mx-auto text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-5 border border-red-200">
        <AlertCircle className="w-7 h-7" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2 font-mono">
        Admin Runtime Error
      </span>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101313] mb-3 font-sans">
        The admin workspace encountered an issue.
      </h1>

      <p className="text-sm text-[#667085] max-w-md mx-auto mb-8 font-sans">
        An error occurred while loading this section of the admin panel. Your saved data in the database remains intact.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry Operation</span>
        </button>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e8ece9] text-[#101313] text-xs font-semibold hover:bg-[#f8faf9] transition"
        >
          <LayoutDashboard className="w-4 h-4 text-[#667085]" />
          <span>Back to Overview</span>
        </Link>
        <Link
          href="/admin/system"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e8ece9] text-[#101313] text-xs font-semibold hover:bg-[#f8faf9] transition"
        >
          <Activity className="w-4 h-4 text-[#667085]" />
          <span>System Status</span>
        </Link>
      </div>

      {/* Diagnostics Card */}
      <div className="w-full text-left bg-white border border-[#e8ece9] rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#e8ece9]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#101313]">Diagnostics &amp; Logs</span>
            {error.digest && (
              <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                Digest: {error.digest}
              </span>
            )}
          </div>
          <button
            onClick={copyError}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#078a4b] hover:underline cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Log"}</span>
          </button>
        </div>

        <div className="mt-3">
          <p className="text-xs font-mono text-red-600 font-semibold break-all">
            {error.message || "Unknown error"}
          </p>
        </div>

        {error.stack && (
          <div className="mt-3 pt-3 border-t border-[#e8ece9]">
            <button
              onClick={() => setShowStack(!showStack)}
              className="flex items-center gap-1.5 text-xs text-[#667085] hover:text-[#101313] transition font-medium cursor-pointer"
            >
              <span>{showStack ? "Hide Stack Trace" : "Show Full Stack Trace"}</span>
              {showStack ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showStack && (
              <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-[11px] font-mono overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto">
                {error.stack}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
