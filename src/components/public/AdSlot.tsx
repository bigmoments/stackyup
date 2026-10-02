"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight, Sparkles } from "lucide-react";
import { adsConfig, AdSlotConfig } from "@/config/ads";
import { DBAdPlacement, resolveSlotConfig } from "@/lib/ads-shared";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  variant:
    | "sidebar"
    | "in-article"
    | "bottom-article"
    | "in-feed"
    | "header"
    | "below_title"
    | "in_content"
    | "after_content"
    | "footer";
  slotId?: string;
  className?: string;
  configOverride?: Partial<AdSlotConfig>;
  placement?: DBAdPlacement;
}

export default function AdSlot({
  variant,
  slotId,
  className = "",
  configOverride,
  placement,
}: AdSlotProps) {
  const adRef = useRef<HTMLModElement | null>(null);

  // Map variant to DB slotKey
  const dbSlotKey =
    variant === "in-article" || variant === "in_content"
      ? "in_content"
      : variant === "bottom-article" || variant === "after_content"
      ? "after_content"
      : variant === "in-feed"
      ? "homepage_sidebar"
      : variant === "header"
      ? "header"
      : variant === "below_title"
      ? "below_title"
      : variant === "footer"
      ? "footer"
      : "sidebar";

  const resolved = resolveSlotConfig(dbSlotKey, placement);

  const finalConfig: AdSlotConfig = {
    enabled: resolved.enabled,
    type: resolved.type,
    adSlot: resolved.adSlot,
    custom: resolved.custom,
    ...configOverride,
  };

  const adClientId = resolved.adClient || adsConfig.adsenseClientId;

  // 1. If slot disabled or type is "none", render NOTHING
  if (!finalConfig.enabled || finalConfig.type === "none") {
    return null;
  }

  // 2. If type is "adsense", but AdSense is missing client ID or slot ID, DO NOT RENDER ANYTHING (NO PLACEHOLDER)
  if (finalConfig.type === "adsense") {
    if (!adClientId || !adClientId.trim() || !finalConfig.adSlot) {
      return null;
    }
  }

  // 3. If type is "custom", ensure either custom banner (card or image) or customHtml exists
  if (finalConfig.type === "custom") {
    const hasCustomBanner = Boolean(
      finalConfig.custom &&
        ((finalConfig.custom.title && finalConfig.custom.title.trim()) ||
          (finalConfig.custom.imageUrl && finalConfig.custom.imageUrl.trim()))
    );
    const hasCustomHtml = Boolean(resolved.customHtml && resolved.customHtml.trim());
    if (!hasCustomBanner && !hasCustomHtml) {
      return null;
    }
  }

  const isAdSense = finalConfig.type === "adsense";

  // Initialize AdSense push on mount
  useEffect(() => {
    if (isAdSense && typeof window !== "undefined") {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.warn("[AdSlot] AdSense push error:", err);
      }
    }
  }, [isAdSense]);

  // ==========================================
  // 1. GOOGLE ADSENSE RENDERER
  // ==========================================
  if (isAdSense) {
    return (
      <div
        id={slotId || `ad-${variant}`}
        className={`ad-container clear-both select-none ${className}`}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] block text-center mb-1.5 font-sans">
          ADVERTISEMENT
        </span>

        {/* Load AdSense script once if not already present */}
        <Script
          id="google-adsense"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClientId}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />

        <div className="overflow-hidden rounded-2xl bg-[#fafafa] border border-[#eaedeb] flex items-center justify-center min-h-[100px]">
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={adClientId}
            data-ad-slot={finalConfig.adSlot}
            data-ad-format={finalConfig.adFormat || "auto"}
            data-full-width-responsive={finalConfig.fullWidthResponsive ? "true" : "false"}
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. CUSTOM HTML RENDERER (Raw HTML snippet)
  // ==========================================
  if (resolved.customHtml) {
    return (
      <div
        id={slotId || `ad-${variant}`}
        className={`ad-container clear-both select-none ${className}`}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block text-center mb-1.5 font-sans">
          SPONSORED
        </span>
        <div dangerouslySetInnerHTML={{ __html: resolved.customHtml }} />
      </div>
    );
  }

  // ==========================================
  // 3. STRUCTURED CUSTOM / AFFILIATE PROMO RENDERER
  // ==========================================
  const custom = finalConfig.custom;
  if (!custom) return null;

  // ------------------------------------------
  // Check if Pure Image Banner Mode is requested
  // ------------------------------------------
  const isImageOnly = custom.imageUrl && (custom.format === "image" || !custom.title);

  if (isImageOnly && custom.imageUrl) {
    return (
      <div className={`space-y-1.5 select-none clear-both ${className}`}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] block text-center font-sans">
          {custom.badge || "SPONSORED"}
        </span>

        <a
          href={custom.ctaUrl || "#"}
          target={custom.ctaUrl?.startsWith("http") ? "_blank" : undefined}
          rel={custom.ctaUrl?.startsWith("http") ? "noopener noreferrer nofollow" : undefined}
          className="group block relative overflow-hidden rounded-2xl border border-[#eaedeb] hover:border-[#079653]/50 transition-all duration-300 shadow-2xs hover:shadow-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={custom.imageUrl}
            alt={custom.title || "Sponsored Partner"}
            className="w-full h-auto object-cover block group-hover:scale-[1.01] transition-transform duration-300"
            loading="lazy"
          />
        </a>
      </div>
    );
  }

  // VARIANT A: SIDEBAR (Sleek Dark Card with IDE preview or banner)
  if (variant === "sidebar") {
    return (
      <div className={`space-y-1.5 select-none ${className}`}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] block text-center">
          ADVERTISEMENT
        </span>

        <div className="relative rounded-2xl bg-[#0a0f0d] text-white p-5 overflow-hidden border border-[#1f2923] min-h-[240px] flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          {/* Subtle green ambient radial glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#22c55e]/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Logo & UI preview */}
          <div className="flex items-start justify-between relative z-10 gap-2">
            <div className="flex-1 min-w-0 pr-1">
              {/* Badge / Brand Name */}
              {custom.badge && (
                <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-lg">
                  <span className="font-mono bg-white text-black px-1.5 py-0.5 rounded text-xs font-black">
                    {custom.badge}
                  </span>
                </div>
              )}

              <div className="mt-3.5 space-y-1">
                <h4 className="font-bold text-[18px] text-white leading-[1.2]">
                  {custom.title}{" "}
                  {custom.highlightText && (
                    <span className="text-[#22c55e]">{custom.highlightText}</span>
                  )}
                </h4>
                <p className="text-[12px] text-[#9ca3af] leading-relaxed max-w-[150px] pt-1">
                  {custom.description}
                </p>
              </div>

              <div className="pt-3.5">
                <a
                  href={custom.ctaUrl}
                  target={custom.ctaUrl.startsWith("http") ? "_blank" : undefined}
                  rel={custom.ctaUrl.startsWith("http") ? "noopener noreferrer nofollow" : undefined}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-neutral-100 text-[#0a0f0d] font-bold text-[12px] px-3.5 py-1.5 rounded-full transition shadow-xs"
                >
                  <span>{custom.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Dark IDE Mockup preview on the right */}
            {custom.showIdeMockup && (
              <div className="w-[105px] h-[155px] rounded-lg bg-[#141b17] border border-[#27362e] p-2 flex flex-col justify-between shrink-0 shadow-xl opacity-90 -mr-1 mt-1">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/80" />
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/80" />
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/80" />
                  </div>
                  <div className="h-1.5 w-12 bg-white/10 rounded" />
                  <div className="h-1.5 w-16 bg-[#22c55e]/30 rounded" />
                  <div className="h-1.5 w-8 bg-white/10 rounded" />
                </div>
                <div className="rounded bg-[#0a0f0d] p-1.5 border border-white/5 space-y-1">
                  <div className="h-1 w-10 bg-[#22c55e]/50 rounded" />
                  <div className="h-1 w-14 bg-white/10 rounded" />
                  <div className="h-1 w-8 bg-white/10 rounded" />
                </div>
                <div className="h-3.5 rounded bg-[#22c55e]/20 border border-[#22c55e]/40 flex items-center justify-center">
                  <span className="text-[7.5px] text-[#22c55e] font-mono font-bold">Generate</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VARIANT B: BOTTOM ARTICLE (Wide horizontal card positioned before comments)
  if (variant === "bottom-article") {
    return (
      <div className={`my-8 select-none clear-both ${className}`}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] block text-center mb-2">
          SPONSORED RECOMMENDATION
        </span>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#f8faf9] border border-[#eaedeb] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1 max-w-xl">
            {custom.badge && (
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#eaf7f0] text-[#079653] mb-1">
                {custom.badge}
              </span>
            )}
            <h4 className="font-bold text-[16px] text-[#101313]">
              {custom.title}
            </h4>
            <p className="text-[13px] text-[#4b5563] leading-relaxed">
              {custom.description}
            </p>
          </div>

          <Link
            href={custom.ctaUrl}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#079653] hover:bg-[#057842] text-white text-xs font-semibold shrink-0 transition shadow-xs"
          >
            <span>{custom.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // VARIANT C: IN-FEED (Editorial grid card blending into publication feed)
  if (variant === "in-feed") {
    return (
      <div className={`bg-white rounded-2xl border border-[#eaedeb] p-5 flex flex-col justify-between hover:border-[#079653]/40 transition-colors shadow-2xs select-none ${className}`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f4fbf7] text-[#079653] border border-[#d6e8de]">
              {custom.badge || "Sponsored"}
            </span>
            <span className="text-[10.5px] font-medium text-[#9ca3af]">Staff Recommendation</span>
          </div>

          <div className="aspect-video w-full rounded-xl bg-[#0a0f0d] text-white p-4 flex flex-col justify-between overflow-hidden relative border border-[#1f2923]">
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-[#22c55e]/25 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-1.5 text-xs text-[#22c55e] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified AI Architecture</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white line-clamp-1">{custom.title}</p>
              <p className="text-[11px] text-[#9ca3af] mt-0.5 line-clamp-2">{custom.description}</p>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-[#eaedeb] flex items-center justify-between">
          <span className="text-[11px] text-[#9ca3af]">stackyup.com/deals</span>
          <Link
            href={custom.ctaUrl}
            className="text-xs font-semibold text-[#079653] hover:underline flex items-center gap-1"
          >
            <span>{custom.ctaText}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  // VARIANT D: IN-ARTICLE
  return (
    <div className={`my-8 p-4 rounded-xl bg-[#f4fbf7] border border-[#d6e8de] text-center clear-both select-none ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] block mb-1">
        SPONSORED
      </span>
      <h5 className="font-bold text-[14px] text-[#101313]">{custom.title}</h5>
      <p className="text-xs text-[#4b5563] mt-1 max-w-md mx-auto">{custom.description}</p>
      <Link
        href={custom.ctaUrl}
        className="inline-block mt-3 px-3.5 py-1.5 rounded-lg bg-[#079653] text-white text-xs font-semibold hover:bg-[#057842] transition"
      >
        {custom.ctaText} →
      </Link>
    </div>
  );
}
