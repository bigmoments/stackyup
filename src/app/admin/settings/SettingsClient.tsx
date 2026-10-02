"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  Save,
  CheckCircle2,
  Globe,
  Sliders,
  Palette,
  Users,
  Search,
  ExternalLink,
  HelpCircle,
  BarChart3,
  UploadCloud,
} from "lucide-react";
import { useDialog } from "@/components/ui/CustomDialog";

interface AuthorOption {
  id: string;
  name: string;
  role?: string | null;
  isDefault: boolean;
}

interface SettingsClientProps {
  initialSettings: Record<string, string>;
  authorsList?: AuthorOption[];
}

export default function SettingsClient({
  initialSettings,
  authorsList = [],
}: SettingsClientProps) {
  const router = useRouter();
  const dialog = useDialog();
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    site_name: initialSettings.site_name || "StackYup",
    site_tagline: initialSettings.site_tagline || "Modern AI & Tech Tools for Freelancers",
    site_url: initialSettings.site_url || "http://localhost:3000",
    admin_email: initialSettings.admin_email || "admin@stackyup.com",
    posts_per_page: initialSettings.posts_per_page || "10",
    default_author_name: initialSettings.default_author_name || "Adit",
    meta_description: initialSettings.meta_description || "Honest, in-depth reviews and comparisons of modern AI tools, automation stacks, and workflows for freelancers.",
    google_analytics_id: initialSettings.google_analytics_id || "",
    ga_property_id: initialSettings.ga_property_id || "",
    ga_service_account_json: initialSettings.ga_service_account_json || "",
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
          Configure site identity, default editorial parameters, and publishing pagination.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Site settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: General Identity */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
            <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#079653]" />
              <span>General Identity</span>
            </h3>
            <a
              href={form.site_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#079653] hover:underline flex items-center gap-1 font-medium"
            >
              <span>Visit Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">
                Site Name *
              </label>
              <input
                type="text"
                required
                value={form.site_name}
                onChange={(e) => handleChange("site_name", e.target.value)}
                placeholder="e.g. StackYup"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
              />
              <span className="text-[11px] text-[#667085] mt-1 block">
                Displayed in browser title, logo brand, and RSS feeds.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">
                Public Site URL *
              </label>
              <input
                type="url"
                required
                value={form.site_url}
                onChange={(e) => handleChange("site_url", e.target.value)}
                placeholder="https://stackyup.com"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653] font-mono"
              />
              <span className="text-[11px] text-[#667085] mt-1 block">
                Canonical domain used for OpenGraph URLs and sitemap generation.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101313] mb-1">
              Site Tagline / Motto
            </label>
            <input
              type="text"
              value={form.site_tagline}
              onChange={(e) => handleChange("site_tagline", e.target.value)}
              placeholder="e.g. Modern AI & Tech Tools for Freelancers"
              className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101313] mb-1">
              Default Homepage Meta Description
            </label>
            <textarea
              rows={2}
              value={form.meta_description}
              onChange={(e) => handleChange("meta_description", e.target.value)}
              placeholder="Summary shown on Google SERP and social media embeds for the homepage..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101313] mb-1">
              Admin Notification Email
            </label>
            <input
              type="email"
              value={form.admin_email}
              onChange={(e) => handleChange("admin_email", e.target.value)}
              placeholder="admin@stackyup.com"
              className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
            />
          </div>
        </div>

        {/* Section 2: Google Analytics 4 (GA4) Tracking */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
            <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#079653]" />
              <span>Google Analytics 4 (GA4) Integration</span>
            </h3>
            <Link
              href="/admin/analytics"
              className="text-xs text-[#079653] hover:underline flex items-center gap-1 font-medium"
            >
              <span>View Analytics Dashboard →</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">
                GA4 Measurement ID
              </label>
              <input
                type="text"
                value={form.google_analytics_id}
                onChange={(e) => handleChange("google_analytics_id", e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs font-mono text-[#101313] focus:outline-none focus:border-[#079653]"
              />
              <span className="text-[11px] text-[#667085] mt-1 block">
                Official Google Analytics ID. Once saved, gtag.js automatically tracks all visitor page views without slowing down your site.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">
                Google Analytics Property ID (Optional)
              </label>
              <input
                type="text"
                value={form.ga_property_id}
                onChange={(e) => handleChange("ga_property_id", e.target.value)}
                placeholder="e.g. 456789123"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs font-mono text-[#101313] focus:outline-none focus:border-[#079653]"
              />
              <span className="text-[11px] text-[#667085] mt-1 block">
                Used by Google Analytics Data API to sync real visitor metrics into your Admin Dashboard.
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="ga_service_account_json_field" className="block text-xs font-semibold text-[#101313]">
                Google Cloud Service Account JSON Key
              </label>
              <div>
                <input
                  ref={jsonFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      if (content) {
                        try {
                          const parsed = JSON.parse(content);
                          if (parsed.type === "service_account" && parsed.client_email) {
                            handleChange("ga_service_account_json", content);
                            dialog.success(`File "${file.name}" berhasil diunggah dan dibaca! (${parsed.client_email})`, "Kredensial Terdeteksi");
                          } else {
                            handleChange("ga_service_account_json", content);
                            dialog.success(`File "${file.name}" berhasil dimuat.`, "File Terbaca");
                          }
                        } catch (err) {
                          dialog.error("File yang diunggah bukan format JSON Google Cloud yang valid!", "Format Tidak Valid");
                        }
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EAF8F0] hover:bg-[#d5f0e1] text-[#079653] font-semibold text-xs cursor-pointer transition"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload JSON File</span>
                </button>
              </div>
            </div>

            <textarea
              id="ga_service_account_json_field"
              rows={3}
              value={form.ga_service_account_json}
              onChange={(e) => handleChange("ga_service_account_json", e.target.value)}
              placeholder='Pilih file JSON service account dengan tombol "Upload JSON File" di atas atau paste langsung isi JSON ke sini...'
              className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs font-mono text-[#101313] focus:outline-none focus:border-[#079653]"
            />
            <span className="text-[11px] text-[#667085] mt-1 block">
              Klik tombol hijau <b>Upload JSON File</b> untuk otomatis memilih file <code>stackyup-510408-dc85d0d75e50.json</code> dari komputer Anda tanpa perlu copy-paste manual.
            </span>
          </div>
        </div>

        {/* Section 2: Publishing & Editorial Parameters */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
            <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#079653]" />
              <span>Publishing &amp; Editorial</span>
            </h3>
            <Link
              href="/admin/authors"
              className="text-xs text-[#079653] hover:underline flex items-center gap-1 font-medium"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Authors &amp; Personas ({authorsList.length})</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">
                Articles Per Page (Pagination)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={form.posts_per_page}
                onChange={(e) => handleChange("posts_per_page", e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
              />
              <span className="text-[11px] text-[#667085] mt-1 block">
                Number of article cards per page in homepage &amp; archive feeds.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#101313]">
                  Default Author Persona
                </label>
                <Link
                  href="/admin/authors"
                  className="text-[11px] text-[#079653] hover:underline font-medium"
                >
                  Manage Authors →
                </Link>
              </div>

              {authorsList.length > 0 ? (
                <select
                  value={form.default_author_name}
                  onChange={(e) => handleChange("default_author_name", e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                >
                  {authorsList.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name} {a.role ? `(${a.role})` : ""} {a.isDefault ? "★ Current Default" : ""}
                    </option>
                  ))}
                  {!authorsList.some((a) => a.name === form.default_author_name) && (
                    <option value={form.default_author_name}>
                      {form.default_author_name} (Custom)
                    </option>
                  )}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.default_author_name}
                  onChange={(e) => handleChange("default_author_name", e.target.value)}
                  placeholder="e.g. Adit"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                />
              )}

              <span className="text-[11px] text-[#667085] mt-1 block">
                Default author assigned to new articles and autonomous AI publishers when omitted.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Visual Appearance & Quick Links */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
            <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#079653]" />
              <span>Appearance &amp; Navigation Customization</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/admin/theme"
              className="p-4 rounded-xl border border-[#E6EBE8] hover:border-[#079653] bg-[#F8FAF9] hover:bg-[#EAF8F0]/30 transition group flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-[#EAF8F0] text-[#079653] flex items-center justify-center shrink-0">
                <Palette className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-[#101313] group-hover:text-[#079653] flex items-center gap-1">
                  <span>Theme &amp; Typography</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </h4>
                <p className="text-[11px] text-[#667085]">
                  Brand colors, typography (Plus Jakarta Sans, Inter, Outfit), and aesthetic presets.
                </p>
              </div>
            </Link>

            <Link
              href="/admin/menus"
              className="p-4 rounded-xl border border-[#E6EBE8] hover:border-[#079653] bg-[#F8FAF9] hover:bg-[#EAF8F0]/30 transition group flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-[#EAF8F0] text-[#079653] flex items-center justify-center shrink-0">
                <Sliders className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-[#101313] group-hover:text-[#079653] flex items-center gap-1">
                  <span>Navigation Menus</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </h4>
                <p className="text-[11px] text-[#667085]">
                  Configure header top navigation links and footer category menus.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[#667085]">
            Changes take effect immediately across all public routes and automated feeds.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Saving Settings..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

