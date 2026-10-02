"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Power,
  Sparkles,
  Zap,
  Terminal,
  ExternalLink,
  Layers,
  Code2,
  FileCode,
  ShieldCheck,
  Send,
  HelpCircle,
  X,
  RotateCw,
  Cpu,
  Globe,
  Radio,
  FileCheck,
  BookOpen,
  Settings,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  RefreshCw,
  Save,
  Download,
  FileDown,
} from "lucide-react";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

interface PostItem {
  id: string;
  title: string;
  slug: string;
  authorName: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

interface AiAgentsClientProps {
  initialKeys: ApiKeyItem[];
  recentPosts: PostItem[];
  initialSettings: Record<string, string>;
  stats: {
    totalKeys: number;
    activeKeys: number;
    totalPosts: number;
    totalMedia: number;
  };
  agentSpecMarkdown?: string;
}

export default function AiAgentsClient({
  initialKeys,
  recentPosts: initialRecentPosts,
  initialSettings,
  stats,
  agentSpecMarkdown = "",
}: AiAgentsClientProps) {
  const router = useRouter();

  // Navigation Tab State
  const [mainTab, setMainTab] = useState<
    "governance" | "generator" | "keys" | "stream" | "playground" | "contracts" | "markdown_spec"
  >("governance");

  // API Keys state
  const [keys, setKeys] = useState<ApiKeyItem[]>(initialKeys);
  const [recentPosts, setRecentPosts] = useState<PostItem[]>(initialRecentPosts);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Key Modal
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKeySecret, setCreatedKeySecret] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);

  // Governance Settings State (Backed by schema.siteSettings)
  const [museEnabled, setMuseEnabled] = useState(initialSettings["ai_muse_enabled"] !== "false");
  const [musePublishMode, setMusePublishMode] = useState<"draft" | "published">(
    (initialSettings["ai_muse_publish_mode"] as any) || "draft"
  );
  const [museDefaultAuthor, setMuseDefaultAuthor] = useState(initialSettings["ai_muse_author"] || "Muse AI Publisher");
  const [museDefaultCategory, setMuseDefaultCategory] = useState(initialSettings["ai_muse_category"] || "AI Tools");

  const [hermesEnabled, setHermesEnabled] = useState(initialSettings["ai_hermes_enabled"] !== "false");
  const [hermesDefaultAuthor, setHermesDefaultAuthor] = useState(initialSettings["ai_hermes_author"] || "Hermes AI Benchmark");

  const [openclawEnabled, setOpenclawEnabled] = useState(initialSettings["ai_openclaw_enabled"] !== "false");
  const [webhookUrl, setWebhookUrl] = useState(initialSettings["ai_webhook_notify_url"] || "");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  // In-App Article Generator State
  const [genTopic, setGenTopic] = useState("");
  const [genCategory, setGenCategory] = useState("AI Tools");
  const [genPersona, setGenPersona] = useState<"muse" | "hermes">("muse");
  const [genStatus, setGenStatus] = useState<"draft" | "published">("draft");
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<any | null>(null);

  // Playground / Tester State
  const [playgroundEndpoint, setPlaygroundEndpoint] = useState<"create_post" | "get_post" | "publish_post" | "list_media">("create_post");
  const [testTitle, setTestTitle] = useState("Empirical Benchmark: 5 Best Local LLM Runners in 2026");
  const [testTags, setTestTags] = useState("AI Tools, Comparisons, Tech");
  const [testSlug, setTestSlug] = useState("why-small-language-models-are-silently-winning");
  const [testPostId, setTestPostId] = useState(recentPosts[0]?.id || "post__fwGOfYFibm-kNJW");
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundResponse, setPlaygroundResponse] = useState<{ status: number; timeMs: number; data: any } | null>(null);

  // Helper copy function
  function copyToClipboard(text: string, identifier: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(identifier);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }

  // Save Governance Settings to Database
  async function handleSaveSettings() {
    setSavingSettings(true);
    setSettingsFeedback(null);
    try {
      const payload = {
        ai_muse_enabled: museEnabled ? "true" : "false",
        ai_muse_publish_mode: musePublishMode,
        ai_muse_author: museDefaultAuthor,
        ai_muse_category: museDefaultCategory,
        ai_hermes_enabled: hermesEnabled ? "true" : "false",
        ai_hermes_author: hermesDefaultAuthor,
        ai_openclaw_enabled: openclawEnabled ? "true" : "false",
        ai_webhook_notify_url: webhookUrl,
      };

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      setSettingsFeedback("Agent governance settings saved successfully to database!");
      setTimeout(() => setSettingsFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  }

  // In-App Article Generation with Agent Engine
  async function handleGenerateArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!genTopic.trim()) return;

    setGenLoading(true);
    setGenResult(null);

    try {
      const res = await fetch("/api/admin/ai-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: genTopic.trim(),
          category: genCategory,
          persona: genPersona,
          save_to_db: true,
          status: genStatus,
          author_name: genPersona === "hermes" ? hermesDefaultAuthor : museDefaultAuthor,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Generation failed");

      setGenResult(data);

      // Add to local recent posts
      if (data.savedPost) {
        setRecentPosts([
          {
            id: data.savedPost.id,
            title: data.title,
            slug: data.savedPost.slug,
            authorName: genPersona === "hermes" ? hermesDefaultAuthor : museDefaultAuthor,
            status: data.savedPost.status,
            publishedAt: data.savedPost.status === "published" ? new Date().toISOString() : null,
            createdAt: new Date().toISOString(),
          },
          ...recentPosts,
        ]);
      }
    } catch (err: any) {
      alert(err.message || "Article generation error");
    } finally {
      setGenLoading(false);
    }
  }

  // Create API Key
  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreatingKey(true);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create key");

      setCreatedKeySecret(data.key);
      setKeys([
        {
          id: data.id,
          name: data.name,
          keyPrefix: "sy_live_",
          isActive: true,
          lastUsedAt: null,
          createdAt: new Date().toISOString(),
        },
        ...keys,
      ]);
      setNewKeyName("");
    } catch (err: any) {
      alert(err.message || "Failed to generate key");
    } finally {
      setCreatingKey(false);
    }
  }

  // Toggle API Key Active status
  async function handleToggleKey(id: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setKeys(keys.map((k) => (k.id === id ? { ...k, isActive: !currentActive } : k)));
    } catch (err: any) {
      alert(err.message || "Failed to toggle key status");
    }
  }

  // Delete API Key
  async function handleDeleteKey(id: string) {
    if (!confirm("Are you sure you want to delete and revoke this API key? Connected agents will immediately lose access.")) return;

    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete key");
      setKeys(keys.filter((k) => k.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete key");
    }
  }

  // Run API Playground Test
  async function handleRunPlayground() {
    setPlaygroundLoading(true);
    setPlaygroundResponse(null);
    const startTime = performance.now();

    try {
      let res: Response;
      if (playgroundEndpoint === "create_post") {
        const payload = {
          title: testTitle,
          content_html: `<p>Automated test generation via StackYup AI Agents Hub.</p><h2>Benchmark Highlights</h2><p>Evaluated execution speed, memory footprint, and production developer experience.</p>`,
          excerpt: "Automated analysis of modern AI software tools.",
          meta_description: "Comprehensive benchmark comparison of software tools in 2026.",
          tags: testTags.split(",").map((t) => t.trim()),
          faq: [{ question: "Is this test automated?", answer: "Yes, verified via the StackYup Agent API." }],
          status: "draft",
        };

        res = await fetch("/api/v1/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": `test-${Date.now()}`,
          },
          body: JSON.stringify(payload),
        });
      } else if (playgroundEndpoint === "get_post") {
        res = await fetch(`/api/v1/posts/${testSlug}`);
      } else if (playgroundEndpoint === "publish_post") {
        res = await fetch(`/api/v1/posts/${testPostId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "published" }),
        });
      } else {
        res = await fetch("/api/v1/media?limit=5");
      }

      const timeMs = Math.round(performance.now() - startTime);
      const data = await res.json();
      setPlaygroundResponse({
        status: res.status,
        timeMs,
        data,
      });
    } catch (err: any) {
      const timeMs = Math.round(performance.now() - startTime);
      setPlaygroundResponse({
        status: 500,
        timeMs,
        data: { error: err.message || "Request failed" },
      });
    } finally {
      setPlaygroundLoading(false);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 1. System Header & Breadcrumb */}
      <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#667085] mb-1.5">
            <Link href="/admin" className="hover:text-[#101313] transition">Admin</Link>
            <span>/</span>
            <span className="text-[#101313] font-semibold">Integrations</span>
            <span>/</span>
            <span className="text-[#078a4b] font-semibold">AI Agents Hub</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#101313] flex items-center gap-2.5">
            <span>AI Agents Hub &amp; Publishing API</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF8F0] border border-[#c1e8d0] text-[#078a4b] text-[11px] font-bold">
              REST v1 • OpenAPI 3.1 • MCP
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-[#667085] mt-1 max-w-2xl">
            Autonomous agent publishing connector for <strong className="text-[#101313]">Muse AI</strong>, <strong className="text-[#101313]">Hermes</strong>, <strong className="text-[#101313]">OpenClaw</strong>, and Claude Desktop MCP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Copy Base API URL */}
          <button
            type="button"
            onClick={() =>
              copyToClipboard(
                typeof window !== "undefined"
                  ? `${window.location.origin}/api/v1`
                  : "http://localhost:3000/api/v1",
                "hub-base-url"
              )
            }
            className="px-3 py-2 rounded-xl bg-[#EAF8F0] hover:bg-[#d8f2e4] text-[#078a4b] text-xs font-bold border border-[#c1e8d0] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Copy Base API URL (http://localhost:3000/api/v1)"
          >
            {copiedKey === "hub-base-url" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === "hub-base-url" ? "Base URL Copied!" : "Copy Base API"}</span>
          </button>

          {/* Quick Copy Master Bearer Key */}
          {process.env.NEXT_PUBLIC_CMS_API_KEY && (
            <button
              type="button"
              onClick={() =>
                copyToClipboard(process.env.NEXT_PUBLIC_CMS_API_KEY!, "hub-master-key")
              }
              className="px-3 py-2 rounded-xl bg-[#101313] hover:bg-[#202525] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Copy Master Bearer API Key"
            >
              {copiedKey === "hub-master-key" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Key className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{copiedKey === "hub-master-key" ? "Key Copied!" : "Copy API Key"}</span>
            </button>
          )}

          {/* OpenAPI Pill with Link + Copy Button */}
          <div className="flex items-center rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] overflow-hidden shadow-2xs">
            <a
              href="/api/v1/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 hover:bg-white text-[#101313] text-xs font-semibold transition flex items-center gap-1.5"
              title="Open OpenAPI 3.1 Spec JSON"
            >
              <FileCode className="w-3.5 h-3.5 text-[#078a4b]" />
              <span>OpenAPI 3.1</span>
              <ExternalLink className="w-3 h-3 text-[#8a9099]" />
            </a>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  typeof window !== "undefined"
                    ? `${window.location.origin}/api/v1/openapi.json`
                    : "http://localhost:3000/api/v1/openapi.json",
                  "hub-openapi-url"
                )
              }
              className="px-2 py-2 hover:bg-white text-[#667085] hover:text-[#078a4b] border-l border-[#E6EBE8] transition cursor-pointer"
              title="Copy OpenAPI URL to clipboard"
            >
              {copiedKey === "hub-openapi-url" ? <Check className="w-3.5 h-3.5 text-[#078a4b]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* MCP Protocol Pill with Link + Copy Button */}
          <div className="flex items-center rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] overflow-hidden shadow-2xs">
            <a
              href="/api/v1/mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 hover:bg-white text-[#101313] text-xs font-semibold transition flex items-center gap-1.5"
              title="Open MCP Protocol Spec"
            >
              <Cpu className="w-3.5 h-3.5 text-sky-600" />
              <span>MCP Protocol</span>
              <ExternalLink className="w-3 h-3 text-[#8a9099]" />
            </a>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  typeof window !== "undefined"
                    ? `${window.location.origin}/api/v1/mcp`
                    : "http://localhost:3000/api/v1/mcp",
                  "hub-mcp-url"
                )
              }
              className="px-2 py-2 hover:bg-white text-[#667085] hover:text-sky-600 border-l border-[#E6EBE8] transition cursor-pointer"
              title="Copy MCP Endpoint URL to clipboard"
            >
              {copiedKey === "hub-mcp-url" ? <Check className="w-3.5 h-3.5 text-sky-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <a
            href="/api/v1/agent-spec.md?download=1"
            className="px-3 py-2 rounded-xl bg-[#F8FAF9] hover:bg-white text-[#101313] text-xs font-semibold border border-[#E6EBE8] transition flex items-center gap-1.5 shadow-2xs"
            title="Download AI_AGENT_INTEGRATION.md"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>Spec (.md)</span>
          </a>

          <button
            onClick={() => setShowNewKeyModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Key</span>
          </button>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-[#E6EBE8] rounded-2xl shadow-2xs">
        {[
          { id: "governance", label: "Agent Governance & Config", icon: Sliders },
          { id: "markdown_spec", label: "Agent Spec (.md)", icon: FileDown, badge: "Download / Copy" },
          { id: "generator", label: "In-App AI Generator", icon: Sparkles, badge: "New" },
          { id: "keys", label: `API Keys (${keys.length})`, icon: Key },
          { id: "stream", label: `Ingestion Stream (${recentPosts.length})`, icon: Radio },
          { id: "playground", label: "Live API Playground", icon: Terminal },
          { id: "contracts", label: "Contracts & Prompts", icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = mainTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-[#101313] text-white shadow-xs"
                  : "text-[#667085] hover:text-[#101313] hover:bg-[#F8FAF9]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#078a4b]" : "text-[#8a9099]"}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 bg-[#078a4b] text-white text-[9px] font-bold rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Alert */}
      {settingsFeedback && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#078a4b] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{settingsFeedback}</span>
        </div>
      )}

      {/* TAB 1: GOVERNANCE & FULL SYSTEM CONFIG */}
      {mainTab === "governance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Muse AI Profile Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE8]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF8F0] text-[#078a4b] flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#101313]">Muse AI</h3>
                    <p className="text-[11px] text-[#667085]">Daily Publishing Agent</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={museEnabled}
                    onChange={(e) => setMuseEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#078a4b]"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">
                    Publishing Workflow Mode
                  </label>
                  <select
                    value={musePublishMode}
                    onChange={(e) => setMusePublishMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs font-medium text-[#101313]"
                  >
                    <option value="draft">Review Required (Save as Draft)</option>
                    <option value="published">Autonomous (Direct Live Publish)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">
                    Default Author Attribution
                  </label>
                  <input
                    type="text"
                    value={museDefaultAuthor}
                    onChange={(e) => setMuseDefaultAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">
                    Default Category
                  </label>
                  <select
                    value={museDefaultCategory}
                    onChange={(e) => setMuseDefaultCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs font-medium text-[#101313]"
                  >
                    <option value="AI Tools">AI Tools</option>
                    <option value="Comparisons">Comparisons</option>
                    <option value="Freelancers">Freelancers</option>
                    <option value="Reviews">Reviews</option>
                    <option value="Tech">Tech</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Hermes Evaluator Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE8]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#101313]">Hermes</h3>
                    <p className="text-[11px] text-[#667085]">Benchmark &amp; Research Agent</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hermesEnabled}
                    onChange={(e) => setHermesEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#078a4b]"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">
                    Specialization
                  </label>
                  <p className="text-[#667085] leading-relaxed">
                    Auto-structures benchmark comparison tables, token speed metrics, and Google FAQPage schemas.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">
                    Default Author Attribution
                  </label>
                  <input
                    type="text"
                    value={hermesDefaultAuthor}
                    onChange={(e) => setHermesDefaultAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                  />
                </div>
              </div>
            </div>

            {/* OpenClaw Syndicator Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE8]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#101313]">OpenClaw</h3>
                    <p className="text-[11px] text-[#667085]">Scraper &amp; Syndication Agent</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openclawEnabled}
                    onChange={(e) => setOpenclawEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#078a4b]"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">
                    Syndication Mode
                  </label>
                  <p className="text-[#667085] leading-relaxed">
                    Monitors changelogs and GitHub releases. Automatically applies deduplication keys.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook & Notification Settings */}
          <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
              <div>
                <h3 className="text-sm font-bold text-[#101313] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#078a4b]" />
                  <span>Real-time Ingestion Webhook Alerts</span>
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Sends HTTP POST payloads to Discord, Slack, or n8n whenever an agent publishes an article or uploads media.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#078a4b]"
                />
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingSettings ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Agent Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: AGENT MARKDOWN SPECIFICATION (.MD) */}
      {mainTab === "markdown_spec" && (
        <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E6EBE8]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#EAF8F0] border border-[#c1e8d0] text-[#078a4b] text-[11px] font-bold">
                  AI_AGENT_INTEGRATION.md
                </span>
                <span className="text-xs text-[#667085]">v2.0 Enterprise Spec</span>
              </div>
              <h3 className="text-lg font-bold text-[#101313] mt-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#078a4b]" />
                <span>Autonomous AI Agent Specification &amp; Protocols</span>
              </h3>
              <p className="text-xs text-[#667085] mt-0.5 max-w-2xl">
                Ready-to-use markdown document containing system directives, anti-slop guidelines, OpenAPI &amp; MCP schemas, Python agent runner, Claude Desktop MCP, and OpenClaw workflows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(agentSpecMarkdown, "full-markdown-spec")}
                className="px-4 py-2.5 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                title="Copy entire markdown file to clipboard"
              >
                {copiedKey === "full-markdown-spec" ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey === "full-markdown-spec" ? "Copied to Clipboard!" : "Copy Full Markdown"}</span>
              </button>

              <a
                href="/api/v1/agent-spec.md?download=1"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F8FAF9] text-[#101313] text-xs font-bold border border-[#E6EBE8] transition shadow-2xs flex items-center gap-2 cursor-pointer"
                title="Download AI_AGENT_INTEGRATION.md to your computer"
              >
                <Download className="w-4 h-4 text-amber-600" />
                <span>Download .md File</span>
              </a>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    typeof window !== "undefined"
                      ? `${window.location.origin}/api/v1/agent-spec.md`
                      : "http://localhost:3000/api/v1/agent-spec.md",
                    "raw-spec-url"
                  )
                }
                className="px-3.5 py-2.5 rounded-xl bg-[#F8FAF9] hover:bg-white text-[#667085] hover:text-[#101313] text-xs font-semibold border border-[#E6EBE8] transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="Copy raw HTTP URL for AI agent prompts"
              >
                {copiedKey === "raw-spec-url" ? <Check className="w-3.5 h-3.5 text-[#078a4b]" /> : <ExternalLink className="w-3.5 h-3.5" />}
                <span>{copiedKey === "raw-spec-url" ? "URL Copied" : "Copy Raw URL"}</span>
              </button>
            </div>
          </div>

          {/* Quick Integration Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] space-y-1.5">
              <div className="text-xs font-bold text-[#101313] flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[#078a4b]" />
                <span>1. Prompt-Based Agents</span>
              </div>
              <p className="text-[11px] text-[#667085] leading-relaxed">
                Click <strong>&quot;Copy Full Markdown&quot;</strong> and paste into ChatGPT Custom GPT, Claude Project, Cursor Rules, or Windsurf context.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] space-y-1.5">
              <div className="text-xs font-bold text-[#101313] flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-sky-600" />
                <span>2. Autonomous Python / Node.js</span>
              </div>
              <p className="text-[11px] text-[#667085] leading-relaxed">
                Run the included <code>agent_runner.py</code> script on your VPS or Docker container to autonomously draft and publish.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] space-y-1.5">
              <div className="text-xs font-bold text-[#101313] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>3. Claude Desktop MCP</span>
              </div>
              <p className="text-[11px] text-[#667085] leading-relaxed">
                Use the JSON configuration inside this spec in <code>claude_desktop_config.json</code> to register StackYup publishing tools.
              </p>
            </div>
          </div>

          {/* Interactive Markdown Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#667085]">
              <span className="font-semibold text-[#101313]">Document Preview</span>
              <span className="font-mono text-[11px]">
                {agentSpecMarkdown ? `${agentSpecMarkdown.split("\n").length} lines • ${(agentSpecMarkdown.length / 1024).toFixed(1)} KB` : "Loading..."}
              </span>
            </div>

            <div className="relative rounded-2xl bg-[#1a202c] border border-gray-700 overflow-hidden shadow-md">
              <div className="px-4 py-2.5 bg-[#2d3748] border-b border-gray-700 flex items-center justify-between text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-[11px] font-bold">AI_AGENT_INTEGRATION.md</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(agentSpecMarkdown, "viewer-copy")}
                  className="px-2.5 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-[11px] font-semibold flex items-center gap-1 transition"
                >
                  {copiedKey === "viewer-copy" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === "viewer-copy" ? "Copied" : "Copy Code"}</span>
                </button>
              </div>

              <pre className="p-5 text-gray-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[600px] overflow-y-auto whitespace-pre-wrap select-all">
                {agentSpecMarkdown || "# AI_AGENT_INTEGRATION.md\n\nNo content available."}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IN-APP AI ARTICLE GENERATOR (EMULATING AGENT ENGINE) */}
      {mainTab === "generator" && (
        <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#101313] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>In-App Autonomous Article Generator</span>
            </h3>
            <p className="text-xs text-[#667085] mt-1">
              Trigger the same generation engine used by Muse AI and Hermes directly from your admin panel. Articles are saved directly into the database with revision tracking.
            </p>
          </div>

          <form onSubmit={handleGenerateArticle} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#101313] mb-1">
                Article Topic or Benchmark Query *
              </label>
              <input
                type="text"
                required
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                placeholder="e.g. 7 Best Open-Source AI Coding Models in 2026"
                className="w-full px-4 py-3 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-sm text-[#101313] font-semibold focus:outline-none focus:border-[#078a4b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">Agent Persona</label>
              <select
                value={genPersona}
                onChange={(e) => setGenPersona(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs font-semibold text-[#101313]"
              >
                <option value="muse">Muse AI (Editorial &amp; Workflow Guide)</option>
                <option value="hermes">Hermes (Deep Benchmark &amp; Comparison Table)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">Category</label>
              <select
                value={genCategory}
                onChange={(e) => setGenCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs font-semibold text-[#101313]"
              >
                <option value="AI Tools">AI Tools</option>
                <option value="Comparisons">Comparisons</option>
                <option value="Freelancers">Freelancers</option>
                <option value="Reviews">Reviews</option>
                <option value="Tech">Tech</option>
                <option value="Productivity">Productivity</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101313] mb-1">Target Publishing Status</label>
              <select
                value={genStatus}
                onChange={(e) => setGenStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs font-semibold text-[#101313]"
              >
                <option value="draft">Save as Draft (Review in Editor)</option>
                <option value="published">Publish Immediately to Live Site</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={genLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {genLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{genLoading ? "Synthesizing Article..." : "Generate & Save to Database"}</span>
              </button>
            </div>
          </form>

          {/* Generated Result Preview Card */}
          {genResult && (
            <div className="p-5 rounded-2xl border border-[#d1edd9] bg-[#f4fbf7] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#078a4b]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Article Generated &amp; Saved to Database!</span>
                </div>
                {genResult.savedPost?.id && (
                  <Link
                    href={`/admin/posts/${genResult.savedPost.id}/edit`}
                    className="px-3.5 py-1.5 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>Open in Enterprise Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              <div>
                <h4 className="text-base font-bold text-[#101313]">{genResult.title}</h4>
                <p className="text-xs text-[#596579] mt-1">{genResult.excerpt}</p>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] text-[#667085] font-mono">
                <span className="bg-white px-2.5 py-1 rounded-md border border-[#E6EBE8]">
                  Slug: /{genResult.savedPost?.slug || genResult.slug}
                </span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-[#E6EBE8]">
                  Status: {genResult.savedPost?.status || genStatus}
                </span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-[#E6EBE8]">
                  FAQ Items: {genResult.faq?.length || 0}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: API KEYS & SECURITY */}
      {mainTab === "keys" && (
        <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE8]">
            <div>
              <h3 className="text-sm font-bold text-[#101313] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#078a4b]" />
                <span>Authorized Agent API Keys ({keys.length})</span>
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Every agent (Muse, Hermes, OpenClaw) authenticates with an individual key subject to 60 req/min rate limit.
              </p>
            </div>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="px-3 py-1.5 rounded-lg bg-[#EAF8F0] hover:bg-[#d5f2e1] text-[#078a4b] text-xs font-semibold border border-[#c1e8d0] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Key</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E6EBE8] text-[#8a9099] uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Agent Name</th>
                  <th className="py-2.5 px-3">Prefix</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last Active</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EBE8]">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-[#F8FAF9]/50 transition">
                    <td className="py-3 px-3 font-semibold text-[#101313] flex items-center gap-2">
                      <Bot className="w-3.5 h-3.5 text-[#078a4b]" />
                      <span>{k.name}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#667085]">
                      {k.keyPrefix}••••••••
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          k.isActive ? "bg-[#EAF8F0] text-[#078a4b]" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${k.isActive ? "bg-[#078a4b]" : "bg-gray-400"}`} />
                        {k.isActive ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#667085]">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never used"}
                    </td>
                    <td className="py-3 px-3 text-[#667085]">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => handleToggleKey(k.id, k.isActive)}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          k.isActive
                            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                            : "border-[#078a4b]/30 text-[#078a4b] hover:bg-[#EAF8F0]"
                        }`}
                        title={k.isActive ? "Deactivate key" : "Activate key"}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE INGESTION STREAM (RECENT POSTS) */}
      {mainTab === "stream" && (
        <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE8]">
            <div>
              <h3 className="text-sm font-bold text-[#101313] flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#078a4b]" />
                <span>Live System Ingestion Stream</span>
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Real-time record of articles created by agents or editors in the StackYup database.
              </p>
            </div>
            <Link
              href="/admin/posts"
              className="text-xs font-semibold text-[#078a4b] hover:underline flex items-center gap-1"
            >
              <span>View all in Posts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#E6EBE8]">
            {recentPosts.map((post) => (
              <div key={post.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        post.status === "published"
                          ? "bg-[#EAF8F0] text-[#078a4b]"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {post.status}
                    </span>
                    <span className="text-xs text-[#667085]">By {post.authorName}</span>
                    <span className="text-xs text-[#8a9099]">• {new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#101313]">{post.title}</h4>
                  <p className="text-[11px] font-mono text-[#8a9099]">/{post.slug}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="px-3 py-1.5 rounded-lg border border-[#E6EBE8] bg-[#F8FAF9] hover:bg-white text-xs font-semibold text-[#101313] transition shadow-2xs flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#078a4b]" />
                    <span>Edit in PostEditor</span>
                  </Link>
                  <a
                    href={`/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-[#E6EBE8] text-[#667085] hover:text-[#101313] transition"
                    title="View live post"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: INTERACTIVE API PLAYGROUND */}
      {mainTab === "playground" && (
        <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE8]">
            <div>
              <h3 className="text-sm font-bold text-[#101313] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#078a4b]" />
                <span>Interactive Agent API Tester &amp; Playground</span>
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Simulate AI agent requests directly from browser using your active session or API key.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1.5">Select Agent Endpoint</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "create_post", label: "POST /posts (Draft)" },
                    { id: "get_post", label: "GET /posts/:slug (Verify)" },
                    { id: "publish_post", label: "PATCH /posts/:id (Publish)" },
                    { id: "list_media", label: "GET /media (Gallery)" },
                  ].map((ep) => (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => setPlaygroundEndpoint(ep.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border text-left transition cursor-pointer ${
                        playgroundEndpoint === ep.id
                          ? "bg-[#EAF8F0] border-[#078a4b] text-[#078a4b]"
                          : "bg-[#F8FAF9] border-[#E6EBE8] text-[#667085]"
                      }`}
                    >
                      {ep.label}
                    </button>
                  ))}
                </div>
              </div>

              {playgroundEndpoint === "create_post" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#101313] mb-1">Simulated Title</label>
                    <input
                      type="text"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#101313] mb-1">Tags</label>
                    <input
                      type="text"
                      value={testTags}
                      onChange={(e) => setTestTags(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                    />
                  </div>
                </div>
              )}

              {playgroundEndpoint === "get_post" && (
                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">Article Slug to Verify</label>
                  <input
                    type="text"
                    value={testSlug}
                    onChange={(e) => setTestSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                  />
                </div>
              )}

              {playgroundEndpoint === "publish_post" && (
                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">Post ID (p_...)</label>
                  <input
                    type="text"
                    value={testPostId}
                    onChange={(e) => setTestPostId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313]"
                  />
                </div>
              )}

              <button
                onClick={handleRunPlayground}
                disabled={playgroundLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {playgroundLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{playgroundLoading ? "Sending Agent Request..." : "Execute Agent Request"}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs flex flex-col justify-between min-h-[240px]">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-800 text-[11px] text-gray-400">
                  <span>Response Console</span>
                  {playgroundResponse && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          playgroundResponse.status >= 200 && playgroundResponse.status < 300
                            ? "bg-emerald-950 text-emerald-400"
                            : "bg-red-950 text-red-400"
                        }`}
                      >
                        HTTP {playgroundResponse.status}
                      </span>
                      <span className="text-gray-400">{playgroundResponse.timeMs}ms</span>
                    </div>
                  )}
                </div>

                <pre className="mt-3 text-[11px] overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {playgroundResponse
                    ? JSON.stringify(playgroundResponse.data, null, 2)
                    : "// Select an endpoint and click 'Execute Agent Request' to test response..."}
                </pre>
              </div>

              {playgroundResponse && (
                <div className="pt-2 border-t border-gray-800 text-[10px] text-gray-400 text-right">
                  Verified with StackYup CMS Engine
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CONTRACTS & SYSTEM PROMPTS */}
      {mainTab === "contracts" && (
        <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-4">
          <div className="pb-3 border-b border-[#E6EBE8]">
            <h3 className="text-sm font-bold text-[#101313] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#078a4b]" />
              <span>Official Agent System Prompts &amp; Contract Guide</span>
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Copy-paste these exact system prompts and cURL commands into your Muse, Hermes, or OpenClaw configurations.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#101313]">Muse AI Publishing System Prompt</span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `You are Muse, an autonomous editorial agent for StackYup.
Follow this mandatory 4-step sequence:
1. POST /api/v1/media -> Upload 1200x630 WebP hero illustration with descriptive English alt text.
2. POST /api/v1/posts -> Submit draft with clean semantic HTML, structured FAQ schema, and Idempotency-Key.
3. GET /api/v1/posts/:slug -> Inspect rendered article object and confirm zero missing fields.
4. PATCH /api/v1/posts/:id -> Send status: "published" to activate the post on the live site.`,
                      "prompt-muse"
                    )
                  }
                  className="inline-flex items-center gap-1 text-[#078a4b] hover:underline font-semibold"
                >
                  {copiedKey === "prompt-muse" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "prompt-muse" ? "Copied" : "Copy Prompt"}</span>
                </button>
              </div>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
{`You are Muse, an autonomous editorial agent for StackYup.
Follow this mandatory 4-step sequence:
1. POST /api/v1/media -> Upload 1200x630 WebP hero illustration with descriptive English alt text.
2. POST /api/v1/posts -> Submit draft with clean semantic HTML, structured FAQ schema, and Idempotency-Key.
3. GET /api/v1/posts/:slug -> Inspect rendered article object and confirm zero missing fields.
4. PATCH /api/v1/posts/:id -> Send status: "published" to activate the post on the live site.`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Generate API Key */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6EBE8]">
              <h3 className="text-sm font-bold text-[#101313] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#078a4b]" />
                <span>Generate Agent API Key</span>
              </h3>
              <button
                onClick={() => {
                  setShowNewKeyModal(false);
                  setCreatedKeySecret(null);
                }}
                className="text-[#8a9099] hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdKeySecret ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Copy Your API Secret Key Now</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    For security reasons, this secret key will <strong>never be shown again</strong>. Store it immediately in your agent’s environment file (`.env`).
                  </p>
                </div>

                <div className="relative p-3 bg-gray-900 text-emerald-400 rounded-xl font-mono text-xs break-all select-all flex items-center justify-between gap-2">
                  <span>{createdKeySecret}</span>
                  <button
                    onClick={() => copyToClipboard(createdKeySecret, "secret-key")}
                    className="shrink-0 p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition cursor-pointer"
                    title="Copy Secret Key"
                  >
                    {copiedKey === "secret-key" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowNewKeyModal(false);
                    setCreatedKeySecret(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-semibold cursor-pointer"
                >
                  I Have Safely Saved This Key
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#101313] mb-1">
                    Agent Name / Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Muse AI Production Daemon"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#078a4b]"
                  />
                  <p className="text-[11px] text-[#667085] mt-1">
                    Helps identify which autonomous agent made each API request.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6EBE8]">
                  <button
                    type="button"
                    onClick={() => setShowNewKeyModal(false)}
                    className="px-4 py-2 rounded-xl border border-[#E6EBE8] text-xs font-semibold text-[#667085] hover:bg-[#F8FAF9] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingKey}
                    className="px-4 py-2 rounded-xl bg-[#078a4b] hover:bg-[#066a3d] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    {creatingKey ? "Generating..." : "Generate Secret Key"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
