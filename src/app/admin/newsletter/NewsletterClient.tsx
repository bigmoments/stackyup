"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Send,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Eye,
  X,
} from "lucide-react";

export interface NewsletterCampaign {
  id: string;
  subject: string;
  previewText?: string;
  content: string;
  sentDate: string;
  recipients: number;
  openRate: string;
  clicks: string;
  status: "Sent" | "Draft";
}

interface RecentPostSummary {
  title: string;
  slug: string;
}

interface NewsletterClientProps {
  activeSubscribers: number;
  initialCampaigns: NewsletterCampaign[];
  recentPosts: RecentPostSummary[];
}

export default function NewsletterClient({
  activeSubscribers,
  initialCampaigns,
  recentPosts,
}: NewsletterClientProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>(initialCampaigns);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingCampaign, setViewingCampaign] = useState<NewsletterCampaign | null>(null);

  // Compose State
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [content, setContent] = useState("");
  const [sendToAll, setSendToAll] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function openComposeModal() {
    setSubject("");
    setPreviewText("");
    setContent("");
    setSendToAll(true);
    setError(null);
    setIsModalOpen(true);
  }

  function handleAutoDigest() {
    if (recentPosts.length === 0) {
      setContent(
        "<h2>StackYup Weekly Digest</h2><p>Here are this week's top AI insights and tools for modern freelancers!</p>"
      );
      return;
    }

    const digestHtml = `<h2>🔥 Top Stories in Tech & AI This Week</h2>
<p>Here are the latest curated insights from the StackYup editorial desk:</p>
<ul>
${recentPosts
  .slice(0, 5)
  .map(
    (p) =>
      `  <li><strong><a href="/${p.slug}">${p.title}</a></strong></li>`
  )
  .join("\n")}
</ul>
<p>Stay ahead of the curve with AI tools designed for productivity and growth.</p>
<hr />
<p><small>You received this email because you subscribed to StackYup Newsletter. <a href="#">Unsubscribe</a></small></p>`;

    setContent(digestHtml);
    if (!subject) {
      setSubject(`StackYup Weekly: ${recentPosts[0]?.title || "Latest AI Insights"}`);
    }
  }

  async function handleDispatch(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      setError("Subject line and email content are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          previewText: previewText.trim(),
          content,
          sendToAll,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to dispatch newsletter");

      setCampaigns(data.data.campaigns || [data.data.campaign, ...campaigns]);
      setSuccess(data.data.message || "Newsletter dispatched successfully!");
      setIsModalOpen(false);
      setTimeout(() => setSuccess(null), 4000);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to send newsletter");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this campaign from dispatch history?")) return;

    try {
      const res = await fetch(`/api/admin/newsletter?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      }
    } catch (err) {
      console.error("Delete campaign error:", err);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Audience Distribution
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
            Newsletter Dispatch
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Deliver editorial digests and breaking AI benchmarks directly to your subscribers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/subscribers"
            className="px-4 py-2 rounded-xl bg-white border border-[#E6EBE8] hover:bg-[#F8FAF9] text-xs font-semibold text-[#101313] transition shadow-2xs flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-[#079653]" />
            <span>Manage Subscribers ({activeSubscribers})</span>
          </Link>

          <button
            type="button"
            onClick={openComposeModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-semibold text-xs transition shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>+ Compose Dispatch</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Active Subscribers</span>
          <span className="text-2xl font-extrabold text-[#101313] block">
            {activeSubscribers.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#079653] font-bold">100% deliverability health</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Total Dispatches</span>
          <span className="text-2xl font-extrabold text-[#101313] block">
            {campaigns.length}
          </span>
          <span className="text-[11px] text-[#079653] font-bold">Regular cadence</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-2xs space-y-1">
          <span className="text-xs text-[#667085]">Estimated Open Rate</span>
          <span className="text-2xl font-extrabold text-[#101313] block">48.4%</span>
          <span className="text-[11px] text-[#079653] font-bold">High engagement benchmark</span>
        </div>
      </div>

      {/* Past Dispatches Table */}
      <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#101313]">Recent Dispatches History</h3>
          <span className="text-xs text-[#667085]">{campaigns.length} records</span>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-10 h-10 text-[#8a9099] mx-auto mb-3 opacity-60" />
            <h4 className="text-sm font-bold text-[#101313]">No dispatches sent yet</h4>
            <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
              Broadcast your first newsletter to all active subscribers by clicking Compose Dispatch above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E6EBE8] text-[11px] font-bold uppercase tracking-wider text-[#667085] bg-[#FAFCFB]">
                  <th className="py-2.5 px-3">Subject Line</th>
                  <th className="py-2.5 px-3">Dispatched Date</th>
                  <th className="py-2.5 px-3 text-center">Recipients</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EBE8]">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-[#F8FAF9] transition">
                    <td className="py-3 px-3">
                      <span className="font-semibold text-xs text-[#101313] block">
                        {camp.subject}
                      </span>
                      {camp.previewText && (
                        <span className="text-[11px] text-[#667085] line-clamp-1">
                          {camp.previewText}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-[#667085] whitespace-nowrap">
                      {camp.sentDate}
                    </td>
                    <td className="py-3 px-3 text-xs text-center font-bold text-[#101313]">
                      {camp.recipients.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-xs text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF8F0] text-[#079653]">
                        {camp.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingCampaign(camp)}
                          className="p-1.5 rounded-lg text-[#667085] hover:text-[#079653] hover:bg-[#EAF8F0] transition cursor-pointer"
                          title="Preview Content"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(camp.id)}
                          className="p-1.5 rounded-lg text-[#667085] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Record"
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

      {/* Compose Dispatch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E6EBE8] flex items-center justify-between bg-[#FAFCFB]">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#079653]" />
                <h3 className="font-bold text-sm text-[#101313]">Compose Newsletter Broadcast</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatch} className="p-6 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. StackYup Weekly #19: Top AI Breakthroughs"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">
                  Preview Preheader Text
                </label>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Short teaser line visible before opening email..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] placeholder-[#8a9099] focus:outline-none focus:border-[#079653]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#101313]">
                    Email Content (HTML) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoDigest}
                    className="inline-flex items-center gap-1 text-[11px] text-[#079653] font-bold hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Insert Recent Articles Digest</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="<p>Write your newsletter body or click Auto-Insert...</p>"
                  className="w-full p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] font-mono focus:outline-none focus:border-[#079653]"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendToAll}
                    onChange={(e) => setSendToAll(e.target.checked)}
                    className="accent-[#079653]"
                  />
                  <span className="text-xs font-semibold text-[#101313]">
                    Dispatch to all {activeSubscribers} active subscribers immediately
                  </span>
                </label>
                <p className="text-[11px] text-[#667085] ml-5">
                  If unchecked, sends a single test dispatch to the current admin.
                </p>
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
                  <Send className="w-4 h-4" />
                  <span>{loading ? "Dispatching..." : "Send Dispatch Now"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Content Modal */}
      {viewingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] shadow-2xl max-w-xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E6EBE8] flex items-center justify-between bg-[#FAFCFB]">
              <div>
                <h3 className="font-bold text-sm text-[#101313]">{viewingCampaign.subject}</h3>
                <span className="text-[11px] text-[#667085]">
                  Sent {viewingCampaign.sentDate} to {viewingCampaign.recipients} recipients
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingCampaign(null)}
                className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 prose prose-sm max-w-none text-xs text-[#101313]">
              <div dangerouslySetInnerHTML={{ __html: viewingCampaign.content }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
