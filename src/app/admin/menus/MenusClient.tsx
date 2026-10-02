"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  MoveVertical,
} from "lucide-react";
import { useDialog } from "@/components/ui/CustomDialog";

export interface MenuItem {
  id: string;
  label: string;
  href: string;
}

interface MenusClientProps {
  initialHeaderMenu: MenuItem[];
  initialFooterMenu: MenuItem[];
}

export default function MenusClient({
  initialHeaderMenu,
  initialFooterMenu,
}: MenusClientProps) {
  const router = useRouter();
  const dialog = useDialog();
  const [headerMenu, setHeaderMenu] = useState<MenuItem[]>(initialHeaderMenu);
  const [footerMenu, setFooterMenu] = useState<MenuItem[]>(initialFooterMenu);

  // New Item inputs
  const [newHeaderLabel, setNewHeaderLabel] = useState("");
  const [newHeaderHref, setNewHeaderHref] = useState("");

  const [newFooterLabel, setNewFooterLabel] = useState("");
  const [newFooterHref, setNewFooterHref] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Header operations
  function addHeaderItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newHeaderLabel.trim() || !newHeaderHref.trim()) return;
    const newItem: MenuItem = {
      id: `h_${Date.now()}`,
      label: newHeaderLabel.trim(),
      href: newHeaderHref.trim(),
    };
    setHeaderMenu((prev) => [...prev, newItem]);
    setNewHeaderLabel("");
    setNewHeaderHref("");
  }

  function removeHeaderItem(id: string) {
    setHeaderMenu((prev) => prev.filter((item) => item.id !== id));
  }

  function moveHeaderItem(idx: number, direction: "up" | "down") {
    setHeaderMenu((prev) => {
      const copy = [...prev];
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= copy.length) return prev;
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  }

  // Footer operations
  function addFooterItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newFooterLabel.trim() || !newFooterHref.trim()) return;
    const newItem: MenuItem = {
      id: `f_${Date.now()}`,
      label: newFooterLabel.trim(),
      href: newFooterHref.trim(),
    };
    setFooterMenu((prev) => [...prev, newItem]);
    setNewFooterLabel("");
    setNewFooterHref("");
  }

  function removeFooterItem(id: string) {
    setFooterMenu((prev) => prev.filter((item) => item.id !== id));
  }

  function moveFooterItem(idx: number, direction: "up" | "down") {
    setFooterMenu((prev) => {
      const copy = [...prev];
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= copy.length) return prev;
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  }

  // Save to DB
  async function handleSave() {
    setLoading(true);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headerMenu, footerMenu }),
      });

      if (res.ok) {
        setSuccess("Navigation menus updated and saved successfully!");
        setTimeout(() => setSuccess(null), 3000);
        router.refresh();
      } else {
        dialog.error("Gagal Menyimpan", "Gagal menyimpan konfigurasi menu navigasi.");
      }
    } catch (err: any) {
      dialog.error("Gagal Menyimpan", err.message || "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Site Navigation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
            Navigation Menus
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Configure desktop top horizontal navigation bar and footer legal/institutional links.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-bold text-xs transition shadow-xs cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? "Saving..." : "Save Navigation Menus"}</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Header Navigation */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE8]">
              <div>
                <h3 className="font-bold text-sm text-[#101313]">Main Header Navigation</h3>
                <span className="text-[11px] text-[#667085]">Visible on top header across site</span>
              </div>
              <span className="text-xs text-[#079653] font-bold bg-[#EAF8F0] px-2 py-0.5 rounded-full">
                {headerMenu.length} items
              </span>
            </div>

            {/* List */}
            <div className="space-y-2">
              {headerMenu.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs transition group hover:border-[#079653]"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-[#101313] block truncate">{item.label}</span>
                    <span className="text-[11px] text-[#8a9099] font-mono block truncate">
                      {item.href}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveHeaderItem(idx, "up")}
                      className="p-1 rounded text-[#8a9099] hover:text-[#101313] disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === headerMenu.length - 1}
                      onClick={() => moveHeaderItem(idx, "down")}
                      className="p-1 rounded text-[#8a9099] hover:text-[#101313] disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHeaderItem(item.id)}
                      className="p-1 rounded text-[#8a9099] hover:text-rose-600 cursor-pointer ml-1"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Item Form */}
          <form onSubmit={addHeaderItem} className="pt-4 border-t border-[#E6EBE8] space-y-3">
            <span className="text-xs font-bold text-[#101313] block">+ Add Header Link</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Label (e.g. AI News)"
                value={newHeaderLabel}
                onChange={(e) => setNewHeaderLabel(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
              />
              <input
                type="text"
                required
                placeholder="URL (e.g. /category/news)"
                value={newHeaderHref}
                onChange={(e) => setNewHeaderHref(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] font-mono focus:outline-none focus:border-[#079653]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 rounded-xl bg-[#F0F3F1] hover:bg-[#EAF8F0] hover:text-[#079653] font-semibold text-xs text-[#101313] transition cursor-pointer border border-[#E6EBE8]"
            >
              + Add to Header Menu
            </button>
          </form>
        </div>

        {/* Footer Navigation */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE8]">
              <div>
                <h3 className="font-bold text-sm text-[#101313]">Footer Legal & Institutional</h3>
                <span className="text-[11px] text-[#667085]">Visible on footer directory links</span>
              </div>
              <span className="text-xs text-[#079653] font-bold bg-[#EAF8F0] px-2 py-0.5 rounded-full">
                {footerMenu.length} items
              </span>
            </div>

            {/* List */}
            <div className="space-y-2">
              {footerMenu.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs transition group hover:border-[#079653]"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-[#101313] block truncate">{item.label}</span>
                    <span className="text-[11px] text-[#8a9099] font-mono block truncate">
                      {item.href}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveFooterItem(idx, "up")}
                      className="p-1 rounded text-[#8a9099] hover:text-[#101313] disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === footerMenu.length - 1}
                      onClick={() => moveFooterItem(idx, "down")}
                      className="p-1 rounded text-[#8a9099] hover:text-[#101313] disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFooterItem(item.id)}
                      className="p-1 rounded text-[#8a9099] hover:text-rose-600 cursor-pointer ml-1"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Item Form */}
          <form onSubmit={addFooterItem} className="pt-4 border-t border-[#E6EBE8] space-y-3">
            <span className="text-xs font-bold text-[#101313] block">+ Add Footer Link</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Label (e.g. Careers)"
                value={newFooterLabel}
                onChange={(e) => setNewFooterLabel(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
              />
              <input
                type="text"
                required
                placeholder="URL (e.g. /page/careers)"
                value={newFooterHref}
                onChange={(e) => setNewFooterHref(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] font-mono focus:outline-none focus:border-[#079653]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 rounded-xl bg-[#F0F3F1] hover:bg-[#EAF8F0] hover:text-[#079653] font-semibold text-xs text-[#101313] transition cursor-pointer border border-[#E6EBE8]"
            >
              + Add to Footer Menu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
