"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, ShieldCheck, Code2, Sparkles, ExternalLink, Image as ImageIcon, LayoutTemplate } from "lucide-react";

interface DirectPromo {
  format?: "image" | "card";
  badge?: string;
  title?: string;
  highlightText?: string;
  description?: string;
  ctaText?: string;
  ctaUrl: string;
  imageUrl?: string;
  showIdeMockup?: boolean;
}

interface Placement {
  slotKey: string;
  title: string;
  isEnabled: boolean;
  provider: "adsense" | "direct";
  adClient?: string | null;
  adSlot?: string | null;
  customHtml?: string | null;
  // parsed direct promo fields for direct editing
  directMode?: "banner" | "rawHtml";
  bannerFormat?: "image" | "card";
  promoImageUrl?: string;
  promoBadge?: string;
  promoTitle?: string;
  promoHighlight?: string;
  promoDesc?: string;
  promoCtaText?: string;
  promoCtaUrl?: string;
  promoShowIde?: boolean;
}

const defaultSlots = [
  {
    slotKey: "article_sidebar",
    title: "Article Right Sidebar (Sticky)",
    isEnabled: false,
    provider: "direct" as const,
    adClient: "",
    adSlot: "",
    bannerFormat: "card" as const,
    promoImageUrl: "",
    promoBadge: "v0",
    promoTitle: "Build what you imagine",
    promoHighlight: "with AI.",
    promoDesc: "Turn your ideas into real apps in minutes.",
    promoCtaText: "Try v0 for free",
    promoCtaUrl: "https://v0.dev",
    promoShowIde: true,
  },
  {
    slotKey: "in_article",
    title: "In-Article Content (After 3rd Paragraph)",
    isEnabled: false,
    provider: "adsense" as const,
    adClient: "",
    adSlot: "",
    bannerFormat: "card" as const,
    promoImageUrl: "",
    promoBadge: "SPONSORED",
    promoTitle: "Supercharge your workflow",
    promoHighlight: "",
    promoDesc: "Discover modern developer tools to 10x your output.",
    promoCtaText: "Explore Tools",
    promoCtaUrl: "https://stackyup.com",
    promoShowIde: false,
  },
  {
    slotKey: "bottom_article",
    title: "Bottom Article (Before Responses & Related)",
    isEnabled: false,
    provider: "adsense" as const,
    adClient: "",
    adSlot: "",
    bannerFormat: "card" as const,
    promoImageUrl: "",
    promoBadge: "RECOMMENDED",
    promoTitle: "Level up your freelance tech stack",
    promoHighlight: "",
    promoDesc: "Hand-picked apps and verified automations for independent builders.",
    promoCtaText: "Browse Collection",
    promoCtaUrl: "https://stackyup.com",
    promoShowIde: false,
  },
  {
    slotKey: "homepage_sidebar",
    title: "Homepage Sidebar Banner",
    isEnabled: false,
    provider: "adsense" as const,
    adClient: "",
    adSlot: "",
    bannerFormat: "card" as const,
    promoImageUrl: "",
    promoBadge: "Staff Pick",
    promoTitle: "The Modern Developer Toolkit",
    promoHighlight: "",
    promoDesc: "Curated software stack for fast shipping.",
    promoCtaText: "Read Breakdown",
    promoCtaUrl: "https://stackyup.com",
    promoShowIde: false,
  },
];

export default function AdvertisementsClient({ initialPlacements }: { initialPlacements: any[] }) {
  const router = useRouter();

  // Merge defaultSlots with db records
  const [placements, setPlacements] = useState<Placement[]>(() => {
    return defaultSlots.map((def) => {
      const match = initialPlacements.find((p) => p.slotKey === def.slotKey);
      if (match) {
        let isJson = false;
        let parsedPromo: DirectPromo | null = null;
        const customHtmlStr = (match.customHtml || "").trim();

        if (customHtmlStr.startsWith("{") && customHtmlStr.endsWith("}")) {
          try {
            parsedPromo = JSON.parse(customHtmlStr);
            isJson = true;
          } catch {
            // raw html
          }
        }

        return {
          slotKey: match.slotKey,
          title: match.title || def.title,
          isEnabled: Boolean(match.isEnabled),
          provider: (match.provider as "adsense" | "direct") || def.provider,
          adClient: match.adClient || "",
          adSlot: match.adSlot || "",
          customHtml: isJson ? "" : match.customHtml || "",
          directMode: isJson || !match.customHtml ? "banner" : "rawHtml",
          bannerFormat: parsedPromo?.format ?? (parsedPromo?.imageUrl && !parsedPromo?.title ? "image" : def.bannerFormat),
          promoImageUrl: parsedPromo?.imageUrl ?? def.promoImageUrl,
          promoBadge: parsedPromo?.badge ?? def.promoBadge,
          promoTitle: parsedPromo?.title ?? def.promoTitle,
          promoHighlight: parsedPromo?.highlightText ?? def.promoHighlight,
          promoDesc: parsedPromo?.description ?? def.promoDesc,
          promoCtaText: parsedPromo?.ctaText ?? def.promoCtaText,
          promoCtaUrl: parsedPromo?.ctaUrl ?? def.promoCtaUrl,
          promoShowIde: parsedPromo?.showIdeMockup ?? def.promoShowIde,
        };
      }
      return {
        ...def,
        customHtml: "",
        directMode: "banner",
      };
    });
  });

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function handleChange(slotKey: string, field: string, value: any) {
    setPlacements((prev) =>
      prev.map((item) =>
        item.slotKey === slotKey ? { ...item, [field]: value } : item
      )
    );
  }

  async function handleSave(slot: Placement) {
    setSavingKey(slot.slotKey);
    setSavedMessage(null);

    // Build payload customHtml
    let finalCustomHtml: string | null = null;
    if (slot.provider === "direct") {
      if (slot.directMode === "banner") {
        const promoObj: DirectPromo = {
          format: slot.bannerFormat || "card",
          imageUrl: slot.promoImageUrl || "",
          badge: slot.promoBadge || "",
          title: slot.promoTitle || "",
          highlightText: slot.promoHighlight || "",
          description: slot.promoDesc || "",
          ctaText: slot.promoCtaText || "Learn More",
          ctaUrl: slot.promoCtaUrl || "#",
          showIdeMockup: slot.promoShowIde ?? false,
        };
        finalCustomHtml = JSON.stringify(promoObj);
      } else {
        finalCustomHtml = slot.customHtml || "";
      }
    }

    const payload = {
      slotKey: slot.slotKey,
      title: slot.title,
      isEnabled: slot.isEnabled,
      provider: slot.provider,
      adClient: slot.adClient || null,
      adSlot: slot.adSlot || null,
      customHtml: finalCustomHtml,
    };

    try {
      const res = await fetch("/api/admin/advertisements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSavedMessage(`Saved "${slot.title}" successfully!`);
        setTimeout(() => setSavedMessage(null), 3000);
        router.refresh();
      }
    } catch (err) {
      console.error("Save placement error:", err);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
          Monetization Engine
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
          Ad Placements
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Configure Google AdSense and custom sponsored ad placements dynamically from admin without touching code or .env.
        </p>
      </div>

      {/* CLS & Empty Placeholder Policy Alert */}
      <div className="p-4 rounded-2xl bg-[#EAF8F0] border border-[#c1e8d0] flex items-start gap-3 text-xs text-[#079653]">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Dynamic & Zero-Placeholder System Active:</span>
          <span>
            Changes take effect immediately across all live posts and pages. If a slot is toggled OFF or credentials are blank, no empty gray boxes or dummy ads are ever shown on the live site, preserving pristine UX and Core Web Vitals.
          </span>
        </div>
      </div>

      {savedMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Placements Cards */}
      <div className="space-y-5">
        {placements.map((slot) => {
          const isDirect = slot.provider === "direct";

          return (
            <div
              key={slot.slotKey}
              className={`p-6 rounded-2xl bg-white border transition-all ${
                slot.isEnabled
                  ? "border-[#079653]/40 shadow-xs"
                  : "border-[#E6EBE8] shadow-2xs opacity-90"
              } space-y-4`}
            >
              {/* Header: Title & Switch */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6EBE8]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#101313]">{slot.title}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        slot.isEnabled
                          ? "bg-[#eaf7f0] text-[#079653]"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {slot.isEnabled ? "LIVE ACTIVE" : "OFF / DISABLED"}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8a9099] font-mono">Slot key: {slot.slotKey}</span>
                </div>

                {/* Enabled Toggle Switch */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#667085]">
                    {slot.isEnabled ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleChange(slot.slotKey, "isEnabled", !slot.isEnabled)}
                    className={`w-11 h-6 rounded-full transition p-1 cursor-pointer flex items-center ${
                      slot.isEnabled ? "bg-[#079653] justify-end" : "bg-gray-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-2xs" />
                  </button>
                </div>
              </div>

              {/* Provider Selection Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">
                    Ad Provider
                  </label>
                  <select
                    value={slot.provider}
                    onChange={(e) => handleChange(slot.slotKey, "provider", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] font-medium focus:outline-none focus:border-[#079653]"
                  >
                    <option value="direct">Direct Sponsor / Custom Campaign</option>
                    <option value="adsense">Google AdSense</option>
                  </select>
                </div>

                {/* Google AdSense Fields */}
                {!isDirect ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#101313] mb-1">
                        AdSense Client ID (ca-pub-xxx)
                      </label>
                      <input
                        type="text"
                        value={slot.adClient || ""}
                        onChange={(e) => handleChange(slot.slotKey, "adClient", e.target.value)}
                        placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                        className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#101313] mb-1">
                        Ad Unit Slot ID
                      </label>
                      <input
                        type="text"
                        value={slot.adSlot || ""}
                        onChange={(e) => handleChange(slot.slotKey, "adSlot", e.target.value)}
                        placeholder="1234567890"
                        className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
                      />
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2 flex items-end pb-0.5">
                    <div className="flex items-center gap-4 bg-[#F8FAF9] p-1.5 rounded-xl border border-[#E6EBE8] text-xs">
                      <button
                        type="button"
                        onClick={() => handleChange(slot.slotKey, "directMode", "banner")}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          slot.directMode === "banner"
                            ? "bg-white text-[#079653] shadow-xs"
                            : "text-[#667085] hover:text-[#101313]"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Visual Sponsor Banner</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange(slot.slotKey, "directMode", "rawHtml")}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          slot.directMode === "rawHtml"
                            ? "bg-white text-[#079653] shadow-xs"
                            : "text-[#667085] hover:text-[#101313]"
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Custom HTML / Script</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* DIRECT SPONSOR: Visual Banner Form Fields */}
              {isDirect && slot.directMode === "banner" && (
                <div className="p-4 rounded-xl bg-[#f8faf9] border border-[#eaedeb] space-y-4">
                  {/* Format Sub-selector: Image Banner vs Interactive Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eaedeb]">
                    <div>
                      <span className="text-xs font-bold text-[#101313] block">Banner Presentation Format</span>
                      <span className="text-[11px] text-[#667085]">
                        Pilih &quot;Gambar Saja (Image Banner)&quot; untuk direct banner murni, atau &quot;Interactive Card&quot; untuk badge &amp; teks.
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E6EBE8] text-xs">
                      <button
                        type="button"
                        onClick={() => handleChange(slot.slotKey, "bannerFormat", "image")}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          slot.bannerFormat === "image"
                            ? "bg-[#079653] text-white shadow-2xs"
                            : "text-[#667085] hover:text-[#101313]"
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Gambar Saja (Banner)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange(slot.slotKey, "bannerFormat", "card")}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          slot.bannerFormat !== "image"
                            ? "bg-[#079653] text-white shadow-2xs"
                            : "text-[#667085] hover:text-[#101313]"
                        }`}
                      >
                        <LayoutTemplate className="w-3.5 h-3.5" />
                        <span>Interactive Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Pure Image Banner Option */}
                  {slot.bannerFormat === "image" ? (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#101313] mb-1">
                          Banner Image URL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          value={slot.promoImageUrl || ""}
                          onChange={(e) => handleChange(slot.slotKey, "promoImageUrl", e.target.value)}
                          placeholder="https://.../banner.png atau /uploads/..."
                          className="w-full px-3 py-2 rounded-lg bg-white border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                        />
                        <p className="text-[11px] text-[#667085] mt-1">
                          Bisa menggunakan link gambar CDN eksternal atau file yang diupload di tab Media Library.
                        </p>
                      </div>

                      {/* Image Preview */}
                      {slot.promoImageUrl && (
                        <div className="p-3 bg-white rounded-xl border border-[#E6EBE8] space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">
                            Preview Banner:
                          </span>
                          <div className="max-w-md rounded-lg overflow-hidden border border-[#E6EBE8] bg-[#f8faf9]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={slot.promoImageUrl}
                              alt="Banner Preview"
                              className="w-full h-auto max-h-48 object-contain mx-auto"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#101313] mb-1">
                            Destination URL (Target Link Saat Diklik) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              value={slot.promoCtaUrl || ""}
                              onChange={(e) => handleChange(slot.slotKey, "promoCtaUrl", e.target.value)}
                              placeholder="https://..."
                              className="w-full pl-3 pr-8 py-2 rounded-lg bg-white border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                            />
                            {slot.promoCtaUrl && (
                              <a
                                href={slot.promoCtaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute right-2.5 top-2.5 text-[#667085] hover:text-[#079653]"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#101313] mb-1">
                            Header Label / Badge
                          </label>
                          <input
                            type="text"
                            value={slot.promoBadge || ""}
                            onChange={(e) => handleChange(slot.slotKey, "promoBadge", e.target.value)}
                            placeholder="e.g. SPONSORED, PARTNER, ADVERTISEMENT"
                            className="w-full px-3 py-2 rounded-lg bg-white border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Interactive Card Mode */
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#101313] mb-1">
                            Badge / Label
                          </label>
                          <input
                            type="text"
                            value={slot.promoBadge || ""}
                            onChange={(e) => handleChange(slot.slotKey, "promoBadge", e.target.value)}
                            placeholder="e.g. v0, SPONSORED, PARTNER"
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#101313] mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={slot.promoTitle || ""}
                            onChange={(e) => handleChange(slot.slotKey, "promoTitle", e.target.value)}
                            placeholder="e.g. Build what you imagine"
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#101313] mb-1">
                            Highlight Text (Green)
                          </label>
                          <input
                            type="text"
                            value={slot.promoHighlight || ""}
                            onChange={(e) => handleChange(slot.slotKey, "promoHighlight", e.target.value)}
                            placeholder="e.g. with AI."
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#101313] mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={slot.promoDesc || ""}
                          onChange={(e) => handleChange(slot.slotKey, "promoDesc", e.target.value)}
                          placeholder="Short persuasive pitch..."
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#101313] mb-1">
                            CTA Button Label
                          </label>
                          <input
                            type="text"
                            value={slot.promoCtaText || ""}
                            onChange={(e) => handleChange(slot.slotKey, "promoCtaText", e.target.value)}
                            placeholder="e.g. Try v0 for free"
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#101313] mb-1">
                            Destination URL
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              value={slot.promoCtaUrl || ""}
                              onChange={(e) => handleChange(slot.slotKey, "promoCtaUrl", e.target.value)}
                              placeholder="https://..."
                              className="w-full pl-3 pr-8 py-1.5 rounded-lg bg-white border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                            />
                            {slot.promoCtaUrl && (
                              <a
                                href={slot.promoCtaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute right-2.5 top-2 text-[#667085] hover:text-[#079653]"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {slot.slotKey === "article_sidebar" && (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`showIde-${slot.slotKey}`}
                            checked={Boolean(slot.promoShowIde)}
                            onChange={(e) => handleChange(slot.slotKey, "promoShowIde", e.target.checked)}
                            className="rounded border-[#eaedeb] text-[#079653] focus:ring-0 cursor-pointer"
                          />
                          <label
                            htmlFor={`showIde-${slot.slotKey}`}
                            className="text-xs text-[#4b5563] cursor-pointer"
                          >
                            Show sleek dark IDE mockup preview on the card right side
                          </label>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* DIRECT SPONSOR: Raw HTML / Embed Code */}
              {isDirect && slot.directMode === "rawHtml" && (
                <div className="p-4 rounded-xl bg-[#f8faf9] border border-[#eaedeb] space-y-2">
                  <label className="block text-[11px] font-bold text-[#101313]">
                    Custom HTML / Affiliate Banner Snippet
                  </label>
                  <textarea
                    rows={4}
                    value={slot.customHtml || ""}
                    onChange={(e) => handleChange(slot.slotKey, "customHtml", e.target.value)}
                    placeholder="<a href='https://...' target='_blank'><img src='...' /></a>"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E6EBE8] font-mono text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                  />
                  <p className="text-[11px] text-[#8a9099]">
                    Paste any custom sponsor HTML, third-party affiliate widget, or responsive banner iframe here.
                  </p>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={savingKey === slot.slotKey}
                  onClick={() => handleSave(slot)}
                  className="px-5 py-2.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingKey === slot.slotKey ? "Saving & Syncing..." : "Save Placement"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
