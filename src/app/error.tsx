"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, ArrowLeft, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Log the error to console or error tracking service
    console.error("Unhandled Application Error:", error);
  }, [error]);

  function copyErrorDetails() {
    const details = `Error: ${error.message}\nDigest: ${error.digest || "N/A"}\nStack: ${error.stack || "N/A"}`;
    navigator.clipboard.writeText(details).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Header */}
      <div className="border-b border-[#e8ece9] bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 group">
            <span className="font-sans font-bold text-2xl tracking-tight text-[#101313] group-hover:text-black">
              StackYup<span className="text-[#078a4b]">.</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-[#667085] hover:text-[#101313] transition flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Site</span>
          </Link>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-xl w-full text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-6">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            500 — Application Runtime Error
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#101313] mb-4 font-sans">
            Something unexpected occurred.
          </h1>

          {/* Subtitle */}
          <p className="text-base text-[#667085] leading-relaxed max-w-md mx-auto mb-8 font-sans">
            We encountered a temporary issue while loading this page. Our team has been notified, and your data is safe.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-sm font-medium transition shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#e8ece9] text-[#101313] text-sm font-medium hover:bg-[#f8faf9] transition"
            >
              <Home className="w-4 h-4" />
              <span>Back to Homepage</span>
            </Link>
          </div>

          {/* Technical Details Accordion */}
          <div className="border border-[#e8ece9] rounded-xl bg-[#f8faf9] p-4 text-left">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-xs font-semibold text-[#667085] hover:text-[#101313] transition cursor-pointer"
              >
                <span>Diagnostic Information</span>
                {showDetails ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#8a9099]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#8a9099]" />
                )}
              </button>

              {error.digest && (
                <span className="text-[11px] font-mono text-[#8a9099] bg-white px-2 py-0.5 rounded border border-[#e8ece9]">
                  ID: {error.digest.slice(0, 10)}
                </span>
              )}
            </div>

            {showDetails && (
              <div className="mt-3 pt-3 border-t border-[#e8ece9] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#8a9099]">
                  <span>Technical details for developers &amp; support:</span>
                  <button
                    onClick={copyErrorDetails}
                    className="inline-flex items-center gap-1 text-[#078a4b] hover:underline cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy details"}</span>
                  </button>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#e8ece9] font-mono text-xs text-red-600 overflow-x-auto break-all">
                  <p className="font-semibold mb-1">{error.message || "An unexpected error occurred."}</p>
                  {error.digest && (
                    <p className="text-[11px] text-gray-500">Digest: {error.digest}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
