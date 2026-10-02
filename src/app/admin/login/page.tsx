"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@stackyup.com");
  const [password, setPassword] = useState("stackyup2026!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Invalid credentials");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F7F9F8] font-sans text-[#101313]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 mb-2">
            <span className="font-extrabold text-3xl tracking-tight text-[#101313]">
              StackYup
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#079653] inline-block mb-1" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#101313]">Admin Workspace</h1>
          <p className="text-xs text-[#667085] mt-1">Sign in to manage editorial content, SEO, and publishing</p>
        </div>

        {/* Card Form */}
        <div className="p-8 rounded-2xl bg-white border border-[#E6EBE8] shadow-sm">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8a9099] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@stackyup.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-sm text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8a9099] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-sm text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653] focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#079653] hover:bg-[#068046] text-white text-sm font-semibold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Helper */}
          <div className="mt-6 pt-5 border-t border-[#E6EBE8] text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF8F0] border border-[#d1edd9] text-[11px] text-[#079653]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#079653]" />
              <span>Default: <code>admin@stackyup.com</code> / <code>stackyup2026!</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
