"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Global Application Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8faf9] text-[#101313] font-sans flex items-center justify-center p-4 antialiased">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#e8ece9] p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5 border border-red-100">
            <AlertCircle className="w-6 h-6" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-[#101313] mb-2 font-sans">
            Critical System Error
          </h1>

          <p className="text-sm text-[#667085] leading-relaxed mb-6 font-sans">
            A fatal error occurred at the root application layer. We apologize for the inconvenience.
          </p>

          {error.digest && (
            <div className="mb-6 p-2.5 bg-[#f8faf9] rounded-lg border border-[#e8ece9] font-mono text-[11px] text-[#667085] break-all">
              Error Digest: {error.digest}
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => reset()}
              className="w-full py-2.5 px-4 bg-[#078a4b] hover:bg-[#066a3d] text-white text-sm font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/";
                }
              }}
              className="w-full py-2.5 px-4 bg-white hover:bg-[#f8faf9] border border-[#e8ece9] text-[#101313] text-sm font-medium rounded-xl transition cursor-pointer"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
