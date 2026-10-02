"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownRight, Plus, Trash2, AlertCircle } from "lucide-react";

interface RedirectItem {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
}

export default function RedirectsClient({ initialRedirects }: { initialRedirects: RedirectItem[] }) {
  const router = useRouter();
  const [redirects, setRedirects] = useState<RedirectItem[]>(initialRedirects);
  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");
  const [statusCode, setStatusCode] = useState(301);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!fromPath.trim() || !toPath.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromPath, toPath, statusCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create redirect");

      setRedirects((prev) => [
        { id: data.data.id, fromPath, toPath, statusCode },
        ...prev,
      ]);
      setFromPath("");
      setToPath("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create redirect");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this redirect rule?")) return;
    try {
      const res = await fetch(`/api/admin/redirects?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setRedirects((prev) => prev.filter((r) => r.id !== id));
        router.refresh();
      }
    } catch (err) {
      console.error("Delete redirect failed:", err);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
          SEO & Routing
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
          URL Redirects
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Forward traffic from changed slugs or old Blogger URLs to avoid 404 broken links.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#079653]" />
            <span>Add Redirect Rule</span>
          </h3>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">Source URL (From) *</label>
              <input
                type="text"
                required
                value={fromPath}
                onChange={(e) => setFromPath(e.target.value)}
                placeholder="/old-post-slug"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] font-mono focus:outline-none focus:border-[#079653]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">Destination URL (To) *</label>
              <input
                type="text"
                required
                value={toPath}
                onChange={(e) => setToPath(e.target.value)}
                placeholder="/new-post-slug"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] font-mono focus:outline-none focus:border-[#079653]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">Redirect Type</label>
              <select
                value={statusCode}
                onChange={(e) => setStatusCode(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
              >
                <option value={301}>301 Permanent (SEO standard)</option>
                <option value={302}>302 Temporary</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? "Adding..." : "Add Redirect"}</span>
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E6EBE8] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E6EBE8] text-[11px] font-bold uppercase tracking-wider text-[#667085] bg-[#FAFCFB]">
                  <th className="py-3 px-5">From Path</th>
                  <th className="py-3 px-5">To Destination</th>
                  <th className="py-3 px-5 text-center">Type</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EBE8]">
                {redirects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-[#8a9099] italic">
                      No redirect rules configured.
                    </td>
                  </tr>
                ) : (
                  redirects.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F8FAF9] transition">
                      <td className="py-3 px-5 font-mono text-xs text-[#101313]">
                        {r.fromPath}
                      </td>
                      <td className="py-3 px-5 font-mono text-xs text-[#079653]">
                        {r.toPath}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F4F6F5] text-[#101313] border border-[#E6EBE8]">
                          {r.statusCode}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg text-[#8a9099] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Redirect"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
