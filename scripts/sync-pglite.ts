import path from "path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../src/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

async function syncLocalDb() {
  console.log("Syncing embedded local PGlite database...");
  const dataDir = path.resolve(process.cwd(), ".data", "pglite");
  const pglite = new PGlite(dataDir);
  const db = drizzle(pglite, { schema });

  const richContent = `
<p>AI tools have become essential for freelancers. They help us work faster, automate repetitive tasks, and focus on what really matters — delivering value to clients. In this article, I'll break down 7 of the best AI tools for freelancers in 2026, along with real use cases and practical tips.</p>

<h2 id="chatgpt-the-all-round-assistant">1. ChatGPT – The All-Round Assistant</h2>
<p>ChatGPT remains one of the most useful AI tools for freelancers. It can help with writing, research, brainstorming, coding, and even client communication. With GPT-4o and advanced multimodal reasoning, you can upload client briefs, PDFs, and raw spreadsheet data to generate structured outlines and executive summaries within seconds.</p>

<h2 id="perplexity-research-without-hallucinations">2. Perplexity – Research Without Hallucinations</h2>
<p>When billing clients for research and strategic advice, presenting verified citations in minutes builds immediate authority. Perplexity scans live documentation, academic databases, and current web sources with pinpoint precision.</p>

<h2 id="descript-text-based-video-audio-production">3. Descript – Text-Based Video & Audio Production</h2>
<p>If you produce client video tutorials, podcasts, or Loom overviews, Descript turns video editing into editing a Word document. Delete a filler word like "um" or "uh" in the text transcript, and the underlying video and audio cut seamlessly.</p>

<h2 id="notion-ai-knowledge-base-and-documentation">4. Notion AI – Knowledge Base and Documentation</h2>
<p>Managing multiple client deliverables requires tight context switching. Notion AI searches across all your project databases, past deliverables, and meeting notes to answer natural language questions about deadlines and specifications.</p>

<h2 id="make-com-visual-autonomous-workflows">5. Make.com – Visual Autonomous Workflows</h2>
<p>Connecting LLM API calls with Stripe, Gmail, and Airtable allows solo operators to automate client onboarding, invoice follow-ups, and automated delivery notifications without hiring a virtual assistant.</p>

<h2 id="pricing-value-matrix">6. Pricing & Value Matrix</h2>
<table>
  <thead>
    <tr>
      <th>Tool</th>
      <th>Primary Use Case</th>
      <th>Starting Price</th>
      <th>Est. Weekly Time Saved</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>ChatGPT Plus</td>
      <td>Drafting & Brainstorming</td>
      <td>$20 / mo</td>
      <td>6 - 10 hours</td>
    </tr>
    <tr>
      <td>Perplexity Pro</td>
      <td>Deep Research & Sourcing</td>
      <td>$20 / mo</td>
      <td>4 - 6 hours</td>
    </tr>
    <tr>
      <td>Descript</td>
      <td>Video/Audio Polish</td>
      <td>$16 / mo</td>
      <td>3 - 5 hours</td>
    </tr>
    <tr>
      <td>Notion AI</td>
      <td>Client Knowledge Base</td>
      <td>$10 / mo</td>
      <td>4 - 6 hours</td>
    </tr>
    <tr>
      <td>Make.com</td>
      <td>Workflow Automation</td>
      <td>$9 / mo</td>
      <td>5 - 8 hours</td>
    </tr>
  </tbody>
</table>

<h2 id="final-verdict-where-to-start">7. Final Verdict – Where to Start</h2>
<p>Do not attempt to integrate seven new tools simultaneously. Start by identifying your single biggest non-billable bottleneck this week—whether it is research, coding, or communication—and master that one tool first.</p>
  `;

  await db
    .update(schema.posts)
    .set({
      contentHtml: richContent,
      excerpt:
        "An in-depth breakdown of the 7 essential AI tools every solo freelancer and consultant needs to automate non-billable hours in 2026, with real use cases and practical tips.",
      featuredImageUrl: "/uploads/hero-workspace-freelancer.jpg",
      featuredImageAlt: "A modern workspace with essential AI tools for freelancers in 2026",
      claps: 55,
      authorName: "Adit",
    })
    .where(eq(schema.posts.slug, "7-best-ai-tools-for-freelancers-in-2026"));

  await db
    .update(schema.posts)
    .set({ claps: 68, authorName: "Adit" })
    .where(eq(schema.posts.slug, "claude-3-7-sonnet-vs-gpt-4-5-definitive-benchmark"));

  await db
    .update(schema.posts)
    .set({ claps: 42, authorName: "Adit" })
    .where(eq(schema.posts.slug, "10-ai-prompts-that-saved-freelance-agency-20-hours"));

  await db
    .update(schema.posts)
    .set({ claps: 37, authorName: "Adit" })
    .where(eq(schema.posts.slug, "why-small-language-models-are-silently-winning"));

  // Check comments
  const targetPost = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.slug, "7-best-ai-tools-for-freelancers-in-2026"))
    .limit(1);

  if (targetPost[0]) {
    const existingComments = await db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.postId, targetPost[0].id));

    if (existingComments.length === 0) {
      await db.insert(schema.comments).values([
        {
          id: `cmt_${nanoid(16)}`,
          postId: targetPost[0].id,
          authorName: "Marcus Vance",
          content:
            "Replacing Google with Perplexity Pro alone saved my sanity when writing client whitepapers. Glad to see it highlighted here.",
        },
        {
          id: `cmt_${nanoid(16)}`,
          postId: targetPost[0].id,
          authorName: "Sarah Jenkins",
          content:
            "Cursor with Claude has cut our sprint delivery times in half. Great recommendation to start with just one tool instead of overloading all at once.",
        },
      ]);
      console.log("Seeded initial comments in local PGlite.");
    }
  }

  console.log("Local PGlite database successfully synced!");
}

syncLocalDb().catch(console.error);
