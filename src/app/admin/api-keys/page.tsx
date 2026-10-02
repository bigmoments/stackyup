"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Globe,
  Terminal,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode,
  Cpu,
} from "lucide-react";

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showMasterKey, setShowMasterKey] = useState(false);
  const [origin, setOrigin] = useState("http://localhost:3000");

  const masterApiKey =
    process.env.NEXT_PUBLIC_CMS_API_KEY ||
    "sy_live_0c3f4dc22e7fd9b8ee43d8a0681ad7f179aace26b7bedd54";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
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
    if (
      !confirm(
        "Are you sure you want to revoke and delete this API key? Automated scripts using it will fail."
      )
    ) {
      return;
    }

    try {
      await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
      await loadKeys();
    } catch (err) {
      console.error("Failed to revoke key:", err);
    }
  }

  function handleCopy(text: string, id: string = "key") {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  const curlExample = `curl -X POST "${origin}/api/v1/posts" \\
  -H "Authorization: Bearer ${masterApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Autonomous Benchmark: Modern AI Tools",
    "content_html": "<p>Published via StackYup REST API</p>",
    "tags": ["AI Tools", "Tech"],
    "status": "draft"
  }'`;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Machine Authentication &amp; Integrations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
            API Keys &amp; Endpoints
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Copy active API keys, base URLs, and cURL snippets for autonomous agents and external apps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopy(`${origin}/api/v1`, "top-base-url")}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#F8FAF9] text-[#101313] text-xs font-semibold border border-[#E6EBE8] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Copy API Base URL"
          >
            {copiedId === "top-base-url" ? <Check className="w-3.5 h-3.5 text-[#079653]" /> : <Globe className="w-3.5 h-3.5 text-[#079653]" />}
            <span>{copiedId === "top-base-url" ? "URL Copied!" : "Copy Base URL"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleCopy(masterApiKey, "top-master-key")}
            className="px-3.5 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Copy Master Bearer API Key"
          >
            {copiedId === "top-master-key" ? <Check className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
            <span>{copiedId === "top-master-key" ? "Master Key Copied!" : "Copy Master Key"}</span>
          </button>
        </div>
      </div>

      {/* 1. Master API Key & Live Endpoints Card */}
      <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6EBE8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EAF8F0] text-[#079653] flex items-center justify-center font-bold">
              <Key className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#101313]">Master Publishing Bearer Key</h3>
              <p className="text-xs text-[#667085]">Used to authenticate Muse AI, Python workers, and cURL requests.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMasterKey(!showMasterKey)}
              className="px-2.5 py-1.5 rounded-lg border border-[#E6EBE8] text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              {showMasterKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showMasterKey ? "Hide" : "Reveal"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopy(masterApiKey, "card-master-key")}
              className="px-3.5 py-1.5 rounded-lg bg-[#079653] hover:bg-[#068046] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copiedId === "card-master-key" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === "card-master-key" ? "Copied!" : "Copy Key"}</span>
            </button>
          </div>
        </div>

        {/* Masked / Revealed Key Input */}
        <div className="relative">
          <input
            type={showMasterKey ? "text" : "password"}
            readOnly
            value={masterApiKey}
            className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs font-mono text-[#101313] select-all focus:outline-none focus:border-[#079653]"
          />
        </div>

        {/* 6 Quick Copy Endpoints Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {/* Base URL */}
          <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">
                API Base URL
              </span>
              <code className="text-xs font-mono font-bold text-[#101313] truncate block mt-0.5">
                {origin}/api/v1
              </code>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(`${origin}/api/v1`, "grid-base")}
              className="p-1.5 rounded-lg bg-white border border-[#E6EBE8] hover:border-[#079653] text-[#667085] hover:text-[#079653] transition cursor-pointer shrink-0"
              title="Copy Base API URL"
            >
              {copiedId === "grid-base" ? <Check className="w-3.5 h-3.5 text-[#079653]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Posts Endpoint */}
          <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">
                Publish Article (POST)
              </span>
              <code className="text-xs font-mono font-bold text-[#079653] truncate block mt-0.5">
                POST /api/v1/posts
              </code>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(`${origin}/api/v1/posts`, "grid-posts")}
              className="p-1.5 rounded-lg bg-white border border-[#E6EBE8] hover:border-[#079653] text-[#667085] hover:text-[#079653] transition cursor-pointer shrink-0"
              title="Copy Posts Endpoint URL"
            >
              {copiedId === "grid-posts" ? <Check className="w-3.5 h-3.5 text-[#079653]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Media Endpoint */}
          <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">
                Upload Media (POST)
              </span>
              <code className="text-xs font-mono font-bold text-[#079653] truncate block mt-0.5">
                POST /api/v1/media
              </code>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(`${origin}/api/v1/media`, "grid-media")}
              className="p-1.5 rounded-lg bg-white border border-[#E6EBE8] hover:border-[#079653] text-[#667085] hover:text-[#079653] transition cursor-pointer shrink-0"
              title="Copy Media Upload Endpoint URL"
            >
              {copiedId === "grid-media" ? <Check className="w-3.5 h-3.5 text-[#079653]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* OpenAPI 3.1 Spec */}
          <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">
                OpenAPI 3.1 Spec URL
              </span>
              <code className="text-xs font-mono font-bold text-[#101313] truncate block mt-0.5">
                {origin}/api/v1/openapi.json
              </code>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href="/api/v1/openapi.json"
                target="_blank"
                className="p-1.5 rounded-lg bg-white border border-[#E6EBE8] hover:border-[#079653] text-[#667085] hover:text-[#079653] transition"
                title="Open OpenAPI JSON"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => handleCopy(`${origin}/api/v1/openapi.json`, "grid-openapi")}
                className="p-1.5 rounded-lg bg-white border border-[#E6EBE8] hover:border-[#079653] text-[#667085] hover:text-[#079653] transition cursor-pointer"
                title="Copy OpenAPI URL"
              >
                {copiedId === "grid-openapi" ? <Check className="w-3.5 h-3.5 text-[#079653]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* MCP Protocol */}
          <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">
                Claude MCP Protocol
              </span>
              <code className="text-xs font-mono font-bold text-sky-600 truncate block mt-0.5">
                {origin}/api/v1/mcp
              </code>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href="/api/v1/mcp"
                target="_blank"
                className="p-1.5 rounded-lg bg-white border border-[#E6EBE8] hover:border-[#079653] text-[#667085] hover:text-[#079653] transition"
                title="Open MCP Endpoint"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => handleCopy(`${origin}/api/v1/mcp`, "grid-mcp")}
                className="p-1.5 rounded-lg bg-white border border-[#E6EBE8] hover:border-[#079653] text-[#667085] hover:text-[#079653] transition cursor-pointer"
                title="Copy MCP URL"
              >
                {copiedId === "grid-mcp" ? <Check className="w-3.5 h-3.5 text-[#079653]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Agent Spec Markdown */}
          <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">
                Agent Spec (.md)
              </span>
              <code className="text-xs font-mono font-bold text-amber-700 truncate block mt-0.5">
                {origin}/api/v1/agent-spec.md
              </code>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href="/api/v1/agent-spec.md"
                target="_blank"
                className="p-1.5 rounded-lg bg-white border border-[#E6EBE8] hover:border-[#079653] text-[#667085] hover:text-[#079653] transition"
                title="Open Markdown Spec"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => handleCopy(`${origin}/api/v1/agent-spec.md`, "grid-spec")}
                className="p-1.5 rounded-lg bg-white border border-[#E6EBE8] hover:border-[#079653] text-[#667085] hover:text-[#079653] transition cursor-pointer"
                title="Copy Spec URL"
              >
                {copiedId === "grid-spec" ? <Check className="w-3.5 h-3.5 text-[#079653]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Ready-to-Run cURL Command */}
        <div className="p-4 rounded-xl bg-[#101313] text-gray-200 space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-mono font-bold text-emerald-400">
                Ready-to-Run cURL Command
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(curlExample, "curl-command")}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copiedId === "curl-command" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === "curl-command" ? "Copied Command!" : "Copy cURL"}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap select-all leading-relaxed">
            {curlExample}
          </pre>
        </div>
      </div>

      {/* Newly Created Key Modal Banner */}
      {newlyCreatedKey && (
        <div className="p-6 rounded-2xl bg-[#EAF8F0] border border-[#c1e8d0] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#079653] font-bold text-sm">
            <Sparkles className="w-5 h-5 text-[#079653]" />
            <span>New API Key Generated! Copy it now:</span>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-[#E6EBE8]">
            <code className="text-xs text-[#101313] font-mono break-all flex-1 select-all font-bold">
              {newlyCreatedKey}
            </code>
            <button
              type="button"
              onClick={() => handleCopy(newlyCreatedKey, "new-key")}
              className="px-3.5 py-1.5 rounded-lg bg-[#079653] hover:bg-[#068046] text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              {copiedId === "new-key" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === "new-key" ? "Copied!" : "Copy Key"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-700">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              This key is hashed using SHA-256 and will never be shown again once you dismiss this alert.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setNewlyCreatedKey(null)}
            className="text-xs font-semibold text-[#667085] hover:text-[#101313] underline cursor-pointer"
          >
            I have securely saved this key, close banner
          </button>
        </div>
      )}

      {/* Create Key Card */}
      <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-[#101313]">Generate Dedicated Agent Key</h3>
        <p className="text-xs text-[#667085]">
          Generate individual keys to track usage per autonomous agent or worker script.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={keyNameInput}
            onChange={(e) => setKeyNameInput(e.target.value)}
            placeholder="Key Description (e.g. Muse Daily Worker Key)"
            className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
          />
          <button
            type="button"
            disabled={creating || !keyNameInput.trim()}
            onClick={handleCreateKey}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{creating ? "Generating..." : "Generate Key"}</span>
          </button>
        </div>
      </div>

      {/* Keys Table */}
      <div className="rounded-2xl bg-white border border-[#E6EBE8] overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-[#667085] text-xs">Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="w-10 h-10 text-[#8a9099] mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-[#101313]">No API keys registered</h3>
            <p className="text-xs text-[#667085] mt-1">Generate a key above for AI agent publishing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E6EBE8] text-[11px] font-bold uppercase tracking-wider text-[#667085] bg-[#FAFCFB]">
                  <th className="py-3 px-5">Key Name</th>
                  <th className="py-3 px-5">Identifier Prefix</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5">Last Used</th>
                  <th className="py-3 px-5">Created</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EBE8]">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-[#F8FAF9] transition">
                    <td className="py-3.5 px-5 font-semibold text-xs text-[#101313]">{k.name}</td>
                    <td className="py-3.5 px-5 font-mono text-xs text-[#079653]">
                      <code>{k.keyPrefix}••••••••</code>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF8F0] text-[#079653]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#667085]">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#667085]">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRevoke(k.id)}
                        className="p-1.5 rounded-lg text-[#667085] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
