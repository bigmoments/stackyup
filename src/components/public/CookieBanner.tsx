"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("sy_cookie_consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem("sy_cookie_consent", "accepted");
    setShow(false);
  }

  function handleDecline() {
    localStorage.setItem("sy_cookie_consent", "declined");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-md z-50 p-4 rounded-2xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl shadow-2xl text-xs text-slate-300 space-y-3 animate-fade-in">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">We value your privacy (GDPR &amp; CCPA)</p>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            StackYup uses cookies to deliver optimized content and analyze performance. By clicking &quot;Accept&quot;, you agree to our data practices. Learn more in our{" "}
            <Link href="/page/privacy-policy" className="text-indigo-400 underline hover:text-indigo-300">
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={handleDecline}
          className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition text-[11px] font-medium cursor-pointer"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition text-[11px] font-semibold shadow-md shadow-indigo-600/30 cursor-pointer"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
