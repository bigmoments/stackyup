"use client";

import { useState } from "react";
import {
  Server,
  Database,
  Cpu,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Activity,
  ShieldCheck,
} from "lucide-react";

interface DiagnosticsData {
  nodeEnv: string;
  nodeVersion: string;
  platform: string;
  uptimeSeconds: number;
  memoryRssMb: string;
  memoryHeapUsedMb: string;
  databaseLatencyMs: number;
  databaseConnected: boolean;
  counts: {
    posts: number;
    pages: number;
    media: number;
    comments: number;
    subscribers: number;
  };
  services: {
    cloudinary: boolean;
    redis: boolean;
    databaseUrl: boolean;
  };
}

export default function SystemClient({
  initialDiagnostics,
}: {
  initialDiagnostics: DiagnosticsData;
}) {
  const [data, setData] = useState<DiagnosticsData>(initialDiagnostics);
  const [pinging, setPinging] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function handlePingTest() {
    setPinging(true);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/system");
      const json = await res.json();
      if (res.ok && json.data?.diagnostics) {
        setData(json.data.diagnostics);
        setSuccess(
          `Database ping completed! Latency: ${json.data.diagnostics.databaseLatencyMs}ms`
        );
        setTimeout(() => setSuccess(null), 3500);
      }
    } catch (err) {
      console.error("Ping error:", err);
    } finally {
      setPinging(false);
    }
  }

  async function handleClearCache() {
    setClearing(true);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_cache" }),
      });
      const json = await res.json();
      if (res.ok) {
        setSuccess(json.data?.message || "Cache purged successfully!");
        setTimeout(() => setSuccess(null), 3500);
      }
    } catch (err) {
      console.error("Clear cache error:", err);
    } finally {
      setClearing(false);
    }
  }

  const uptimeHours = (data.uptimeSeconds / 3600).toFixed(1);

  return (
    <div className="space-y-6 font-sans max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Infrastructure & Health
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
            System Diagnostics
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Real-time environment configuration, database ping latency, and memory monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearCache}
            disabled={clearing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E6EBE8] hover:bg-[#F8FAF9] text-xs font-semibold text-[#101313] transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#079653] ${clearing ? "animate-spin" : ""}`} />
            <span>{clearing ? "Purging..." : "Clear Cache"}</span>
          </button>

          <button
            type="button"
            onClick={handlePingTest}
            disabled={pinging}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Activity className={`w-3.5 h-3.5 ${pinging ? "animate-pulse" : ""}`} />
            <span>{pinging ? "Testing..." : "Run Database Ping"}</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 4 Health Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Database Latency</span>
          <span className="text-2xl font-extrabold text-[#079653] block">
            {data.databaseLatencyMs} ms
          </span>
          <span className="text-[11px] text-[#667085]">PGlite / Neon Connected</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Node.js Heap Memory</span>
          <span className="text-2xl font-extrabold text-[#101313] block">
            {data.memoryHeapUsedMb} MB
          </span>
          <span className="text-[11px] text-[#667085]">RSS: {data.memoryRssMb} MB</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Server Uptime</span>
          <span className="text-2xl font-extrabold text-[#101313] block">
            {uptimeHours} hrs
          </span>
          <span className="text-[11px] text-[#079653] font-bold">Process healthy</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Environment</span>
          <span className="text-2xl font-extrabold text-[#101313] block capitalize">
            {data.nodeEnv}
          </span>
          <span className="text-[11px] text-[#667085]">Node {data.nodeVersion}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Table Row Counts */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#079653]" />
            <span>Database Table Records</span>
          </h3>

          <div className="divide-y divide-[#E6EBE8]">
            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#667085] font-medium">Articles (posts)</span>
              <span className="font-bold text-[#101313] font-mono">{data.counts.posts}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#667085] font-medium">Static Pages (pages)</span>
              <span className="font-bold text-[#101313] font-mono">{data.counts.pages}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#667085] font-medium">Media Assets (media)</span>
              <span className="font-bold text-[#101313] font-mono">{data.counts.media}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#667085] font-medium">Audience Comments (comments)</span>
              <span className="font-bold text-[#101313] font-mono">{data.counts.comments}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#667085] font-medium">Subscribers (subscribers)</span>
              <span className="font-bold text-[#101313] font-mono">{data.counts.subscribers}</span>
            </div>
          </div>
        </div>

        {/* Integration Services Status */}
        <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-[#101313] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#079653]" />
            <span>External Infrastructure Status</span>
          </h3>

          <div className="divide-y divide-[#E6EBE8]">
            <div className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#101313] block">Cloudinary Image CDN</span>
                <span className="text-[11px] text-[#667085]">WebP optimized media storage</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  data.services.cloudinary
                    ? "bg-[#EAF8F0] text-[#079653]"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {data.services.cloudinary ? "Configured" : "Local Disk Fallback"}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#101313] block">Upstash Redis KV</span>
                <span className="text-[11px] text-[#667085]">Cache & rate limiter accelerator</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  data.services.redis
                    ? "bg-[#EAF8F0] text-[#079653]"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {data.services.redis ? "Configured" : "In-Memory Fallback"}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#101313] block">PostgreSQL Database Connection</span>
                <span className="text-[11px] text-[#667085]">Persistent relational storage</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  data.services.databaseUrl
                    ? "bg-[#EAF8F0] text-[#079653]"
                    : "bg-[#EAF8F0] text-[#079653]"
                }`}
              >
                {data.services.databaseUrl ? "Remote PostgreSQL" : "Local Embedded PGlite"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
