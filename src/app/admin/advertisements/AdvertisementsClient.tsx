"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Save, CheckCircle2, ShieldCheck, Info } from "lucide-react";

interface Placement {
  slotKey: string;
  title: string;
  isEnabled: boolean;
  provider: string;
  adClient?: string | null;
  adSlot?: string | null;
}

const defaultSlots: Placement[] = [
  {
    slotKey: "article_sidebar",
    title: "Article Right Sidebar (Sticky)",
    isEnabled: false,
    provider: "adsense",
    adClient: "",
    adSlot: "",
  },
  {
    slotKey: "in_article",
    title: "In-Article Content (After 3rd Paragraph)",
    isEnabled: false,
    provider: "adsense",
    adClient: "",
    adSlot: "",
  },
  {
    slotKey: "bottom_article",
    title: "Bottom Article (Before Related Stories)",
    isEnabled: false,
    provider: "adsense",
    adClient: "",
    adSlot: "",
  },
  {
    slotKey: "homepage_sidebar",
    title: "Homepage Sidebar Banner",
    isEnabled: false,
    provider: "adsense",
    adClient: "",
    adSlot: "",
  },
];

export default function AdvertisementsClient({ initialPlacements }: { initialPlacements: any[] }) {
  const router = useRouter();

  // Merge defaultSlots with db records
  const [placements, setPlacements] = useState<Placement[]>(() => {
    return defaultSlots.map((def) => {
      const match = initialPlacements.find((p) => p.slotKey === def.slotKey);
      if (match) {
        return {
          slotKey: match.slotKey,
          title: match.title,
          isEnabled: Boolean(match.isEnabled),
          provider: match.provider || "adsense",
          adClient: match.adClient || "",
          adSlot: match.adSlot || "",
        };
      }
      return def;
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

    try {
      const res = await fetch("/api/admin/advertisements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slot),
      });

      if (res.ok) {
        setSavedMessage(`Saved ${slot.title}`);
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
          Configure Google AdSense and custom sponsored ad placements without hardcoding or CLS layout shifts.
        </p>
      </div>

      {/* CLS & Empty Placeholder Policy Alert */}
      <div className="p-4 rounded-2xl bg-[#EAF8F0] border border-[#c1e8d0] flex items-start gap-3 text-xs text-[#079653]">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Strict Zero-Placeholder Rule Active:</span>
          <span>
            If a slot is toggled OFF or credentials are blank, no empty gray boxes or dummy ads are ever shown on the live site, preserving pristine UX and Core Web Vitals.
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
      <div className="space-y-4">
        {placements.map((slot) => (
          <div
            key={slot.slotKey}
            className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6EBE8]">
              <div>
                <h3 className="font-bold text-sm text-[#101313]">{slot.title}</h3>
                <span className="text-[11px] text-[#8a9099] font-mono">Slot key: {slot.slotKey}</span>
              </div>

              {/* Enabled Toggle Switch */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#667085]">
                  {slot.isEnabled ? "Active" : "Disabled"}
                </span>
                <button
                  type="button"
                  onClick={() => handleChange(slot.slotKey, "isEnabled", !slot.isEnabled)}
                  className={`w-11 h-6 rounded-full transition p-1 cursor-pointer flex items-center ${
                    slot.isEnabled ? "bg-[#079653] justify-end" : "bg-gray-200 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-2xs" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Provider</label>
                <select
                  value={slot.provider}
                  onChange={(e) => handleChange(slot.slotKey, "provider", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                >
                  <option value="adsense">Google AdSense</option>
                  <option value="direct">Direct Sponsor / HTML</option>
                </select>
              </div>

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
                <label className="block text-xs font-semibold text-[#101313] mb-1">Ad Unit Slot ID</label>
                <input
                  type="text"
                  value={slot.adSlot || ""}
                  onChange={(e) => handleChange(slot.slotKey, "adSlot", e.target.value)}
                  placeholder="1234567890"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={savingKey === slot.slotKey}
                onClick={() => handleSave(slot)}
                className="px-4 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingKey === slot.slotKey ? "Saving..." : "Save Placement"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
