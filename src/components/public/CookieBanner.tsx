"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

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
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-md z-50 p-4 sm:p-5 rounded-xl bg-white border border-[#ebebeb] shadow-xl text-xs text-[#242424] space-y-3">
      <div className="flex items-start gap-3">
        <Cookie className="w-5 h-5 text-[#1a8917] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[#242424] text-sm">We value your reading privacy</p>
          <p className="text-[#6b6b6b] leading-relaxed text-xs">
            StackYup uses cookies to analyze reading traffic and improve your experience. Read our{" "}
            <Link href="/page/privacy-policy" className="text-[#1a8917] underline hover:text-[#156d12]">
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={handleDecline}
          className="px-3.5 py-1.5 rounded-full border border-[#ebebeb] text-[#6b6b6b] hover:text-[#242424] hover:bg-[#fafafa] transition text-xs font-medium cursor-pointer"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="px-4 py-1.5 rounded-full bg-[#1a8917] hover:bg-[#156d12] text-white transition text-xs font-medium cursor-pointer shadow-xs"
        >
          Accept
        </button>
      </div>
    </div>
  );
}

