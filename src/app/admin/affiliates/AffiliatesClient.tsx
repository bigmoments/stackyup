"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Link2,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  MousePointerClick,
} from "lucide-react";
import { AffiliatePartner } from "@/app/api/admin/affiliates/route";
import { useDialog } from "@/components/ui/CustomDialog";

interface AffiliatesClientProps {
  initialAffiliates: AffiliatePartner[];
}

export default function AffiliatesClient({ initialAffiliates }: AffiliatesClientProps) {
  const router = useRouter();
  const dialog = useDialog();
  const [affiliates, setAffiliates] = useState<AffiliatePartner[]>(initialAffiliates);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AffiliatePartner | null>(null);

  // Form Fields
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("AI Tools");
  const [destination, setDestination] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [disclosure, setDisclosure] = useState("Affiliate commission link");
  const [status, setStatus] = useState<"Active" | "Paused">("Active");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categories = Array.from(new Set(affiliates.map((a) => a.category)));

  const filtered = affiliates.filter((item) => {
    const matchesSearch =
      item.brand.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.affiliateUrl.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  function openCreateModal() {
    setEditingItem(null);
    setBrand("");
    setCategory("AI Tools");
    setDestination("");
    setAffiliateUrl("");
    setDisclosure("Sponsored partner link");
    setStatus("Active");
    setError(null);
    setIsModalOpen(true);
  }

  function openEditModal(item: AffiliatePartner) {
    setEditingItem(item);
    setBrand(item.brand);
    setCategory(item.category);
    setDestination(item.destination);
    setAffiliateUrl(item.affiliateUrl);
    setDisclosure(item.disclosure);
    setStatus(item.status);
    setError(null);
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!brand.trim() || !affiliateUrl.trim()) {
      setError("Partner Brand name and Affiliate URL are required");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      id: editingItem ? editingItem.id : undefined,
      brand: brand.trim(),
      category: category.trim(),
      destination: destination.trim() || affiliateUrl.trim(),
      affiliateUrl: affiliateUrl.trim(),
      disclosure: disclosure.trim(),
      status,
    };

    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to save partner link");

      setAffiliates(data.data.affiliates);
      setSuccess("Affiliate partner link saved successfully!");
      setIsModalOpen(false);
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save partner link");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: AffiliatePartner) {
    const ok = await dialog.dangerConfirm(
      `Hapus Tautan Afiliasi "${item.brand}"?`,
      "Tautan mitra afiliasi ini akan dihapus dari sistem. Pengalihan tautan aktif mungkin tidak lagi berfungsi.",
      "Ya, Hapus Tautan"
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/affiliates?id=${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setAffiliates((prev) => prev.filter((a) => a.id !== item.id));
        setSuccess(`Removed partner "${item.brand}".`);
        setTimeout(() => setSuccess(null), 3000);
        router.refresh();
      } else {
        const data = await res.json();
        dialog.error("Gagal Menghapus", data.error?.message || "Terjadi kesalahan saat menghapus mitra.");
      }
    } catch (err: any) {
      dialog.error("Gagal Menghapus", err.message || "Gagal menghubungi server.");
    }
  }

  async function handleSimulateClick(item: AffiliatePartner) {
    try {
      await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, incrementClick: true }),
      });
      setAffiliates((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, clicks: a.clicks + 1 } : a))
      );
    } catch (err) {
      console.error("Click increment error:", err);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Revenue Optimization
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
            Affiliate & Partner Links ({affiliates.length})
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Centralized link repository with automatic disclosure and FTC compliance flags.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-semibold text-xs transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Partner Link</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === "all"
                ? "bg-[#EAF8F0] text-[#079653]"
                : "text-[#667085] hover:bg-[#F8FAF9]"
            }`}
          >
            All Categories ({affiliates.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#EAF8F0] text-[#079653]"
                  : "text-[#667085] hover:bg-[#F8FAF9]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#8a9099] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brand, category, or URL..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-[#E6EBE8] overflow-hidden shadow-2xs">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Link2 className="w-10 h-10 text-[#8a9099] mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-[#101313]">No affiliate partners found</h3>
            <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
              Add your first affiliate partner link by clicking the Add Partner Link button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E6EBE8] text-[11px] font-bold uppercase tracking-wider text-[#667085] bg-[#FAFCFB]">
                  <th className="py-3 px-5">Partner Brand</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Affiliate Link</th>
                  <th className="py-3 px-5 text-center">Tracked Clicks</th>
                  <th className="py-3 px-5">Disclosure Policy</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EBE8]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAF9] transition">
                    <td className="py-3.5 px-5 font-semibold text-xs text-[#101313]">
                      {item.brand}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F4F6F5] text-[#4b5563]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <a
                        href={item.affiliateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#079653] font-mono hover:underline flex items-center gap-1 max-w-xs truncate"
                      >
                        <span className="truncate">{item.affiliateUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-center font-bold text-[#101313]">
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{item.clicks.toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => handleSimulateClick(item)}
                          className="p-1 rounded text-[#8a9099] hover:text-[#079653] hover:bg-[#EAF8F0] transition cursor-pointer"
                          title="Simulate / Test Click (+1)"
                        >
                          <MousePointerClick className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#667085]">
                      {item.disclosure}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.status === "Active"
                            ? "bg-[#EAF8F0] text-[#079653]"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-[#667085] hover:text-[#079653] hover:bg-[#EAF8F0] transition cursor-pointer"
                          title="Edit Partner"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg text-[#667085] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Partner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E6EBE8] flex items-center justify-between bg-[#FAFCFB]">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#079653]" />
                <h3 className="font-bold text-sm text-[#101313]">
                  {editingItem ? `Edit Partner: ${editingItem.brand}` : "Add Affiliate Partner Link"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Claude Pro"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="AI LLM"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">
                  Affiliate Link URL *
                </label>
                <input
                  type="url"
                  required
                  value={affiliateUrl}
                  onChange={(e) => setAffiliateUrl(e.target.value)}
                  placeholder="https://partner.com/?via=stackyup"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs font-mono text-[#101313] focus:outline-none focus:border-[#079653]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">
                  Official Destination Website
                </label>
                <input
                  type="url"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="https://partner.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs font-mono text-[#101313] focus:outline-none focus:border-[#079653]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">
                    Disclosure Text
                  </label>
                  <input
                    type="text"
                    value={disclosure}
                    onChange={(e) => setDisclosure(e.target.value)}
                    placeholder="Sponsored affiliate link"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "Active" | "Paused")}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6EBE8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E6EBE8] text-xs font-semibold text-[#667085] hover:bg-[#F8FAF9] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? "Saving..." : "Save Partner Link"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
