"use client";

import { useState, useEffect } from "react";
import { Key, Plus, Copy, Check, Trash2, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyNameInput, setKeyNameInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    try {
      const res = await fetch("/api/admin/api-keys");
      const data = await res.json();
      if (res.ok) {
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error("Failed to load API keys:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateKey() {
    if (!keyNameInput.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyNameInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.key) {
        setNewlyCreatedKey(data.key);
        setKeyNameInput("");
        await loadKeys();
      }
    } catch (err) {
      console.error("Failed to create key:", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Are you sure you want to revoke and delete this API key? Automated scripts using it will fail.")) {
      return;
    }

    try {
      await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
      await loadKeys();
    } catch (err) {
      console.error("Failed to revoke key:", err);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">API Keys Management</h1>
        <p className="text-xs text-slate-400 mt-1">
          Generate, inspect, and revoke Bearer API keys used by Muse and automated publishing agents
        </p>
      </div>

      {/* Newly Created Key Modal Banner */}
      {newlyCreatedKey && (
        <div className="p-6 rounded-2xl bg-indigo-950/70 border border-indigo-500/50 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>New API Key Generated! Copy it now:</span>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-indigo-500/30">
            <code className="text-xs text-indigo-200 font-mono break-all flex-1 select-all">
              {newlyCreatedKey}
            </code>
            <button
              type="button"
              onClick={() => handleCopy(newlyCreatedKey)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Key"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-300/90">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>This key is hashed using SHA-256 and will never be shown again once you dismiss this alert.</span>
          </div>

          <button
            type="button"
            onClick={() => setNewlyCreatedKey(null)}
            className="text-xs font-semibold text-slate-400 hover:text-white underline cursor-pointer"
          >
            I have securely saved this key, close banner
          </button>
        </div>
      )}

      {/* Create Key Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white">Generate New Publishing Key</h3>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={keyNameInput}
            onChange={(e) => setKeyNameInput(e.target.value)}
            placeholder="Key Description (e.g. Muse Daily Worker Key)"
            className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            disabled={creating || !keyNameInput.trim()}
            onClick={handleCreateKey}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Key</span>
          </button>
        </div>
      </div>

      {/* Keys Table */}
      <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No API keys registered</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 bg-slate-950/40">
                  <th className="py-4 px-6">Key Name</th>
                  <th className="py-4 px-6">Identifier Prefix</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Last Used</th>
                  <th className="py-4 px-6">Created</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-4 px-6 font-semibold text-slate-100">{k.name}</td>
                    <td className="py-4 px-6 font-mono text-xs text-indigo-400">
                      <code>{k.keyPrefix}••••••••</code>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleRevoke(k.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Revoke / Delete Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
