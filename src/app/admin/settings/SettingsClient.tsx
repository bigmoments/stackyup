"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, CheckCircle2, Globe, Sliders } from "lucide-react";

export default function SettingsClient({ initialSettings }: { initialSettings: Record<string, string> }) {
  const router = useRouter();
  const [form, setForm] = useState({
    site_name: initialSettings.site_name || "StackYup",
    site_tagline: initialSettings.site_tagline || "Modern AI & Tech Tools for Freelancers",
    site_url: initialSettings.site_url || "http://localhost:3000",
    admin_email: initialSettings.admin_email || "admin@stackyup.com",
    posts_per_page: initialSettings.posts_per_page || "10",
    brand_color: initialSettings.brand_color || "#079653",
    default_author_name: initialSettings.default_author_name || "Adit",
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleChange(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.refresh();
      }
    } catch (err) {
      console.error("Save settings error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
          System Configuration
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
          Site Settings
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Manage general website identity, publishing parameters, and branding.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Site settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Identity */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#079653]" />
            <span>General Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">Site Name *</label>
              <input
                type="text"
                required
                value={form.site_name}
                onChange={(e) => handleChange("site_name", e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">Public URL *</label>
              <input
                type="text"
                required
                value={form.site_url}
                onChange={(e) => handleChange("site_url", e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653] font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101313] mb-1">Tagline / Deck</label>
            <input
              type="text"
              value={form.site_tagline}
              onChange={(e) => handleChange("site_tagline", e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101313] mb-1">Admin Contact Email</label>
            <input
              type="email"
              value={form.admin_email}
              onChange={(e) => handleChange("admin_email", e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
            />
          </div>
        </div>

        {/* Publishing & Branding */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#079653]" />
            <span>Publishing & Branding</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">Articles Per Page</label>
              <input
                type="number"
                value={form.posts_per_page}
                onChange={(e) => handleChange("posts_per_page", e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">Primary Brand Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.brand_color}
                  onChange={(e) => handleChange("brand_color", e.target.value)}
                  className="w-10 h-9 p-0.5 rounded-xl border border-[#E6EBE8] bg-[#F8FAF9] cursor-pointer"
                />
                <input
                  type="text"
                  value={form.brand_color}
                  onChange={(e) => handleChange("brand_color", e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] font-mono focus:outline-none focus:border-[#079653]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#101313] mb-1">Default Author Name</label>
              <input
                type="text"
                value={form.default_author_name}
                onChange={(e) => handleChange("default_author_name", e.target.value)}
                placeholder="e.g. Adit"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
              />
              <span className="text-[11px] text-[#667085] mt-1 block">
                Centralized fallback author persona applied when AI agents or drafts omit the author_name field.
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? "Saving Settings..." : "Save Settings"}</span>
        </button>
      </form>
    </div>
  );
}
