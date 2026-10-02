"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Palette,
  Check,
  Save,
  CheckCircle2,
  Sparkles,
  Eye,
  Type,
  Layout,
} from "lucide-react";

const colorPresets = [
  { name: "StackYup Emerald", hex: "#079653", pill: "#EAF8F0" },
  { name: "Electric Indigo", hex: "#4F46E5", pill: "#EEF2FF" },
  { name: "Obsidian Cyan", hex: "#0284C7", pill: "#E0F2FE" },
  { name: "Vibrant Crimson", hex: "#E11D48", pill: "#FFE4E6" },
  { name: "Amber Sunset", hex: "#D97706", pill: "#FEF3C7" },
  { name: "Imperial Violet", hex: "#7C3AED", pill: "#F3E8FF" },
  { name: "Deep Forest", hex: "#059669", pill: "#ECFDF5" },
];

const fontPresets = [
  { name: "Plus Jakarta Sans", label: "Plus Jakarta Sans (Modern Editorial & Clean)" },
  { name: "Inter", label: "Inter (Technical & High Legibility)" },
  { name: "Outfit", label: "Outfit (Geometric & Friendly)" },
  { name: "Merriweather", label: "Merriweather (Classic Literary Serif)" },
];

interface ThemeClientProps {
  initialBrandColor: string;
  initialFont: string;
  initialSiteName: string;
  initialTagline: string;
}

export default function ThemeClient({
  initialBrandColor,
  initialFont,
  initialSiteName,
  initialTagline,
}: ThemeClientProps) {
  const router = useRouter();
  const [brandColor, setBrandColor] = useState(initialBrandColor || "#079653");
  const [font, setFont] = useState(initialFont || "Plus Jakarta Sans");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_color: brandColor,
          theme_font: font,
        }),
      });

      if (res.ok) {
        setSuccess("Theme styling and brand colors saved successfully!");
        setTimeout(() => setSuccess(null), 3000);
        router.refresh();
      } else {
        alert("Failed to save theme settings");
      }
    } catch (err) {
      console.error("Save theme error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Brand Aesthetics
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
            Design System & Theme
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Configure primary brand accent color, typography hierarchy, and preview components live.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-bold text-xs transition shadow-xs cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? "Saving..." : "Save Theme Settings"}</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Brand Accent Color */}
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#079653]" />
              <span>Primary Brand Accent</span>
            </h3>

            <p className="text-xs text-[#667085]">
              Used for action buttons, active tags, verified badges, and link hovers.
            </p>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {colorPresets.map((preset) => {
                const isSelected = brandColor.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setBrandColor(preset.hex)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? "border-[#079653] bg-[#F8FAF9] ring-2 ring-[#079653]/20"
                        : "border-[#E6EBE8] hover:border-gray-400 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-5 h-5 rounded-full shrink-0 shadow-2xs border border-black/10"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-[#101313] block truncate">
                          {preset.name}
                        </span>
                        <span className="text-[10px] text-[#8a9099] font-mono">
                          {preset.hex}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#079653] shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div className="pt-3 border-t border-[#E6EBE8] flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl border border-[#E6EBE8] shrink-0 shadow-2xs cursor-pointer relative overflow-hidden"
                style={{ backgroundColor: brandColor }}
              >
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-[#667085]">
                  Custom Hex Color Code
                </label>
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs font-mono text-[#101313] focus:outline-none focus:border-[#079653]"
                  placeholder="#079653"
                />
              </div>
            </div>
          </div>

          {/* Typography Settings */}
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
              <Type className="w-4 h-4 text-[#079653]" />
              <span>Typography Hierarchy</span>
            </h3>

            <div className="space-y-2">
              {fontPresets.map((f) => (
                <label
                  key={f.name}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                    font === f.name
                      ? "border-[#079653] bg-[#EAF8F0]/30"
                      : "border-[#E6EBE8] hover:bg-[#F8FAF9]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="font-option"
                      checked={font === f.name}
                      onChange={() => setFont(f.name)}
                      className="accent-[#079653]"
                    />
                    <span className="text-xs font-semibold text-[#101313]">{f.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Component Preview */}
        <div className="lg:col-span-5 space-y-4 sticky top-24">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE8]">
              <span className="text-xs font-bold text-[#101313] flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#079653]" />
                <span>Live Component Preview</span>
              </span>
              <span className="text-[10px] bg-[#F0F3F1] text-[#667085] px-2 py-0.5 rounded-md font-mono">
                {font}
              </span>
            </div>

            {/* Preview Card */}
            <div className="rounded-xl border border-[#E6EBE8] p-5 space-y-4 bg-[#F8FAF9]">
              {/* Category Pill */}
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold"
                  style={{
                    backgroundColor: `${brandColor}18`,
                    color: brandColor,
                  }}
                >
                  AI Tools & Automation
                </span>
                <span className="text-[11px] text-[#8a9099]">Oct 1, 2026 • 5 min read</span>
              </div>

              {/* Title & Excerpt */}
              <div>
                <h4 className="font-extrabold text-base text-[#101313] leading-snug">
                  How AI Autonomous Agents are Redefining Freelancing
                </h4>
                <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                  A definitive guide to automating client onboarding, writing, and code delivery using cutting-edge models.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E6EBE8]">
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-xl text-white text-xs font-bold transition shadow-xs"
                  style={{ backgroundColor: brandColor }}
                >
                  Read Story →
                </button>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E6EBE8] text-[#101313] hover:bg-[#F0F3F1] transition"
                >
                  Bookmark
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F0F3F1] text-[11px] text-[#667085] leading-relaxed">
              💡 <strong>Instant Sync:</strong> Clicking <strong>Save Theme Settings</strong> persists these styling tokens to the CMS settings store.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
