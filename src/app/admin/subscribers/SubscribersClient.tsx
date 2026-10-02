"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Download, Trash2, Search, Mail, AlertCircle } from "lucide-react";
import { useDialog } from "@/components/ui/CustomDialog";

interface Subscriber {
  id: string;
  email: string;
  status: string;
  source: string;
  createdAt: Date;
}

export default function SubscribersClient({ initialSubscribers }: { initialSubscribers: any[] }) {
  const router = useRouter();
  const dialog = useDialog();
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers);
  const [search, setSearch] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim(), source: "admin_manual" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to add subscriber");

      setSubscribers((prev) => [
        { id: data.data.id, email: emailInput.trim(), status: "active", source: "admin_manual", createdAt: new Date() },
        ...prev,
      ]);
      setEmailInput("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to add subscriber");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, email: string) {
    const ok = await dialog.dangerConfirm(
      `Hapus Pelanggan "${email}"?`,
      "Pelanggan ini akan dihapus dari daftar kontak newsletter dan tidak akan menerima buletin email di masa mendatang.",
      "Ya, Hapus Pelanggan"
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/subscribers?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        dialog.error("Gagal Menghapus", data.error?.message || "Gagal menghapus pelanggan.");
      }
    } catch (err: any) {
      dialog.error("Gagal Menghapus", err.message || "Gagal menghubungi server.");
    }
  }

  function handleExportCsv() {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Email,Status,Source,Date"]
        .concat(
          subscribers.map(
            (s) => `${s.id},"${s.email}",${s.status},${s.source},${new Date(s.createdAt).toISOString()}`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stackyup-subscribers-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Audience Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
            Subscribers ({subscribers.length})
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Manage your newsletter audience and monitor acquisition sources.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="px-4 py-2 rounded-xl bg-white border border-[#E6EBE8] hover:bg-[#F8FAF9] text-xs font-semibold text-[#101313] shadow-2xs transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#079653]" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#079653]" />
            <span>Add Subscriber</span>
          </h3>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8a9099] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="subscriber@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? "Adding..." : "Add to List"}</span>
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E6EBE8] overflow-hidden shadow-2xs space-y-3 p-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-[#8a9099] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subscribers by email..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E6EBE8] text-[11px] font-bold uppercase tracking-wider text-[#667085] bg-[#FAFCFB]">
                  <th className="py-2.5 px-3">Subscriber Email</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EBE8]">
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#F8FAF9] transition">
                    <td className="py-2.5 px-3 font-semibold text-xs text-[#101313]">
                      {sub.email}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EAF8F0] text-[#079653]">
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-[#667085]">
                      {sub.source}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-[#8a9099]">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(sub.id, sub.email)}
                        className="p-1.5 rounded-lg text-[#8a9099] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Subscriber"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
