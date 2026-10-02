import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { getCurrentAdmin } from "@/lib/admin-session";
import { verifyApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { db, schema } from "@/db";
import { getUniqueSlug } from "@/lib/slug";
import { cleanHtml } from "@/lib/sanitizer";

export async function POST(request: NextRequest) {
  try {
    let isAuthed = false;
    try {
      const session = await getCurrentAdmin();
      if (session) isAuthed = true;
    } catch {}

    if (!isAuthed) {
      const apiKeyAuth = await verifyApiKey(request);
      if (apiKeyAuth.authenticated) isAuthed = true;
    }

    if (!isAuthed) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json();
    const { topic, category, persona, save_to_db, status: requestedStatus, author_name } = body;

    if (!topic || !topic.trim()) {
      return errorResponse("VALIDATION_ERROR", "Topic is required", null, 400);
    }

    const cleanTopic = topic.trim();
    const cleanCategory = category || "AI Tools";
    const selectedPersona = persona || "muse"; // "muse" (editorial) | "hermes" (benchmark)

    const rawSlug = cleanTopic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const generatedTitle = cleanTopic.includes("2026") ? cleanTopic : `${cleanTopic} in 2026`;
    const excerpt = `Discover the ultimate benchmark of ${cleanTopic}. We analyze real-world performance, productivity gains, and pricing to help you make the right choice.`;
    const metaDescription = `Complete guide & review of ${cleanTopic}. Real-world benchmarks, architecture trade-offs, and actionable tips for creators.`;

    const contentHtml = `
<p class="lead">Navigating the fast-moving artificial intelligence landscape requires clear separation between promotional hype and genuine productivity value. In this hands-on breakdown, we examine <strong>${cleanTopic}</strong> to reveal what actually moves the needle for creators and developers.</p>

<h2>Why ${cleanTopic} Matters Today</h2>
<p>As modern workflows demand greater speed and adaptability, leveraging the right toolset can eliminate hours of manual effort every week. Here are the core advantages observed during testing:</p>

<ul>
  <li><strong>Streamlined Automation:</strong> Reduces recurring operational overhead by up to 60%.</li>
  <li><strong>Consistent Quality:</strong> Enforces standards across outputs with tailored prompt architectures.</li>
  <li><strong>Accelerated Delivery:</strong> Shortens project turnaround times from days to hours.</li>
</ul>

<blockquote>
  <p>"The highest ROI in AI adoption comes not from replacing human creativity, but from eliminating friction in execution."</p>
</blockquote>

<div class="my-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-950 not-prose">
  <div class="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">⚡ Editorial Pro-Tip</div>
  <h4 class="font-bold text-sm mb-1 text-emerald-900">Measure Before Scaling</h4>
  <p class="text-xs">Start with one specialized workflow rather than overhauling your entire pipeline at once. Measure time saved over two weeks before scaling implementation.</p>
</div>

<h2>Feature & Value Comparison</h2>
<div class="overflow-x-auto my-6 not-prose">
  <table class="w-full border-collapse border border-[#e8ece9] rounded-xl text-xs sm:text-sm text-left">
    <thead>
      <tr class="bg-[#f8faf9] text-[#101313] font-semibold">
        <th class="border border-[#e8ece9] p-3">Evaluation Metric</th>
        <th class="border border-[#e8ece9] p-3">Standard Edition</th>
        <th class="border border-[#e8ece9] p-3">Professional Suite</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-[#e8ece9]">
      <tr class="hover:bg-[#f8faf9]/50 transition">
        <td class="border border-[#e8ece9] p-3 font-medium">Context Window</td>
        <td class="border border-[#e8ece9] p-3 text-[#596579]">32k tokens</td>
        <td class="border border-[#e8ece9] p-3 font-bold text-[#078a4b]">200k+ tokens</td>
      </tr>
      <tr class="hover:bg-[#f8faf9]/50 transition">
        <td class="border border-[#e8ece9] p-3 font-medium">Execution Speed</td>
        <td class="border border-[#e8ece9] p-3 text-[#596579]">Standard latency</td>
        <td class="border border-[#e8ece9] p-3 font-bold text-[#078a4b]">Sub-second response</td>
      </tr>
      <tr class="hover:bg-[#f8faf9]/50 transition">
        <td class="border border-[#e8ece9] p-3 font-medium">API Integration</td>
        <td class="border border-[#e8ece9] p-3 text-[#596579]">Basic Webhooks</td>
        <td class="border border-[#e8ece9] p-3 font-bold text-[#078a4b]">Full REST & MCP</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>Final Verdict & Recommendation</h2>
<p>For independent professionals seeking maximum leverage in 2026, investing time into mastering <strong>${cleanTopic}</strong> delivers compounding efficiency gains. Prioritize tool combinations that integrate natively with your existing tech stack.</p>
    `.trim();

    const faq = [
      {
        question: `What makes ${cleanTopic} stand out in 2026?`,
        answer: `It offers superior context handling, lower latency, and highly customizable workflow automations designed specifically for creators and solo operators.`,
      },
      {
        question: `Is there a free trial or starter tier?`,
        answer: `Yes, most leading solutions in this category provide a generous free quota or a 14-day trial without requiring a credit card upfront.`,
      },
    ];

    const tags = [cleanCategory, selectedPersona === "hermes" ? "Comparisons" : "AI Tools", "Productivity"];

    let savedPost: any = null;
    if (save_to_db) {
      const finalSlug = await getUniqueSlug(rawSlug, "posts");
      const postId = `p_${nanoid(16)}`;
      const targetStatus = requestedStatus === "published" ? "published" : "draft";

      await db.insert(schema.posts).values({
        id: postId,
        title: generatedTitle,
        slug: finalSlug,
        contentHtml: cleanHtml(contentHtml),
        excerpt,
        metaDescription,
        tags,
        faqJson: faq,
        authorName: author_name || (selectedPersona === "hermes" ? "Hermes AI Benchmark" : "Muse AI Publisher"),
        status: targetStatus,
        publishedAt: targetStatus === "published" ? new Date() : null,
      });

      // Insert revision record
      await db.insert(schema.revisions).values({
        id: `rev_${nanoid(16)}`,
        postId,
        title: generatedTitle,
        contentHtml: cleanHtml(contentHtml),
      });

      savedPost = {
        id: postId,
        slug: finalSlug,
        status: targetStatus,
      };
    }

    const effectiveAuthor = author_name || (selectedPersona === "hermes" ? "Hermes AI Benchmark" : "Muse AI Publisher");

    return successResponse({
      title: generatedTitle,
      slug: rawSlug,
      excerpt,
      metaDescription,
      contentHtml,
      category: cleanCategory,
      tags,
      faq,
      authorName: effectiveAuthor,
      author_name: effectiveAuthor,
      savedPost,
    });
  } catch (err: any) {
    console.error("AI write error:", err);
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}
