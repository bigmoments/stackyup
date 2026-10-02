import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

import { nanoid } from "nanoid";
import { db, schema } from "../src/db";
import { eq } from "drizzle-orm";

const SAMPLE_POSTS = [
  {
    id: `post_${nanoid(16)}`,
    title: "Claude 3.7 Sonnet vs GPT-4.5: The Definitive Benchmark for Engineers",
    slug: "claude-3-7-sonnet-vs-gpt-4-5-definitive-benchmark",
    excerpt:
      "We ran 50 real-world engineering prompts across frontend, database schema migrations, and complex refactors. Here are the brutal results.",
    metaDescription:
      "In-depth benchmark comparison between Claude 3.7 Sonnet and GPT-4.5 across real coding tasks.",
    featuredImageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop",
    featuredImageAlt: "Abstract neural network benchmark visualization",
    tags: ["Comparisons", "AI Tools", "Tech"],
    status: "published",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    contentHtml: `
<p>Over the past four weeks, our engineering team ran 50 deterministic benchmark tests between Anthropic's Claude 3.7 Sonnet and OpenAI's GPT-4.5. Rather than relying on synthetic puzzle benchmarks like HumanEval, we used dirty, messy real-world codebases with legacy migrations, missing documentation, and nested TypeScript generics.</p>

<h2>The Methodology: Real-World Friction</h2>
<p>Large language models love clean sandbox environments. But production engineering is anything but clean. To measure real-world performance, we evaluated five key parameters:</p>
<ul>
  <li><strong>First-Attempt Accuracy:</strong> Did the generated code run without syntax or compile errors?</li>
  <li><strong>Refactoring Discipline:</strong> Did the model preserve existing business logic and avoid hallucinating new dependencies?</li>
  <li><strong>Token Efficiency:</strong> Total input/output cost required to reach a verified green test suite.</li>
  <li><strong>Architectural Reasoning:</strong> How well does the model reason across multi-file diffs?</li>
</ul>

<blockquote>"Synthetic benchmarks tell you what a model could do in a lab; real production test suites tell you what will page your on-call engineer at 3 AM."</blockquote>

<h2>Benchmark 1: Complex Next.js App Router Refactoring</h2>
<p>We handed both models a 1,200-line client component that needed to be decomposed into Server Actions, dynamic segments, and optimized Suspense boundaries with zero hydration regressions.</p>
<p><strong>Claude 3.7 Sonnet:</strong> Claude immediately caught a subtle race condition in our cache invalidation logic that GPT-4.5 missed. Furthermore, Sonnet's diff was surgical—it replaced only the targeted functions while respecting existing lint rules.</p>
<p><strong>GPT-4.5:</strong> While GPT-4.5 generated clean TypeScript types, it rewrote several unrelated utility functions, introducing two minor breaking changes in our validation middleware.</p>

<h2>Pricing & Throughput Teardown</h2>
<table>
  <thead>
    <tr>
      <th>Model</th>
      <th>Input / 1M Tokens</th>
      <th>Output / 1M Tokens</th>
      <th>Average Latency (TTFT)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Claude 3.7 Sonnet</td>
      <td>$3.00</td>
      <td>$15.00</td>
      <td>380ms</td>
    </tr>
    <tr>
      <td>GPT-4.5</td>
      <td>$75.00</td>
      <td>$150.00</td>
      <td>820ms</td>
    </tr>
  </tbody>
</table>

<h2>Final Verdict: Which Should You Choose?</h2>
<p>For day-to-day software development, Claude 3.7 Sonnet remains our top recommendation for code reasoning, instruction fidelity, and economic efficiency. GPT-4.5 shines in creative prose and broad multimodal synthesis, but for developer workflows, Sonnet takes the crown.</p>
    `,
    faqJson: [
      {
        question: "Is Claude 3.7 Sonnet cheaper than GPT-4.5 for coding?",
        answer: "Yes, significantly. Claude 3.7 Sonnet is roughly 25x less expensive per million input tokens while delivering comparable or superior coding accuracy.",
      },
      {
        question: "Which model is better for TypeScript?",
        answer: "In our benchmark suite, Claude 3.7 Sonnet achieved a 94% first-attempt compile rate on complex generic TypeScript problems, compared to 88% for GPT-4.5.",
      },
    ],
  },
  {
    id: `post_${nanoid(16)}`,
    title: "10 AI Prompts That Saved My Freelance Agency 20 Hours a Week",
    slug: "10-ai-prompts-that-saved-freelance-agency-20-hours",
    excerpt:
      "A no-nonsense blueprint of battle-tested prompt chains for client discovery, proposal generation, and automated scope protection.",
    metaDescription:
      "Discover 10 high-impact AI prompts for freelance professionals to automate proposals and client communications.",
    featuredImageUrl:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop",
    featuredImageAlt: "Team collaborating in a modern workspace",
    tags: ["Freelancers", "Productivity", "AI Tools"],
    status: "published",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    contentHtml: `
<p>When running a boutique digital consultancy, billable time is your most precious asset. Last year, our three-person team was losing nearly 22 hours per week on non-billable overhead: writing custom proposals, parsing messy client discovery notes, and defending scope creep.</p>

<p>Instead of hiring an administrative assistant, we spent a month building structured LLM prompt chains. Here are the top three prompt templates that permanently shifted our unit economics.</p>

<h2>Prompt 1: The 'Scope Sieve' Proposal Blueprint</h2>
<p>Never draft a proposal from scratch again. Paste your raw meeting transcript into this prompt to extract strict deliverables, milestones, and out-of-scope boundaries.</p>

<blockquote>"Act as a cynical legal consultant and senior project manager. Review the client discovery transcript below. Extract: 1. Core Objectives, 2. Strict In-Scope deliverables, 3. Explicitly Out-of-Scope items that could become scope creep, 4. Risk factors."</blockquote>

<h2>Prompt 2: The Diplomatic Scope Deflector</h2>
<p>When a client asks for 'just one quick tweak' that wasn't agreed upon, handling the email diplomatically without sounding combative is crucial. This prompt generates friendly yet firm change order notices.</p>

<h2>Key Takeaways for Freelancers</h2>
<p>The goal of AI in a service business is not to churn out generic content—it is to eliminate administrative fatigue so you can dedicate maximum creative energy to high-value client deliverables.</p>
    `,
    faqJson: [
      {
        question: "Can I use these prompts with free ChatGPT?",
        answer: "Yes, all prompt architectures here work effectively with GPT-4o mini, Claude 3.5 Haiku, or free ChatGPT tiers.",
      },
    ],
  },
  {
    id: `post_${nanoid(16)}`,
    title: "Why Small Language Models (SLMs) Are Silently Winning in Production",
    slug: "why-small-language-models-are-silently-winning",
    excerpt:
      "Why massive trillion-parameter models are getting replaced by lean, local, and sub-10B parameter models for focused enterprise tasks.",
    metaDescription:
      "Explore why small language models (SLMs) like Llama 3.2, Phi-4, and Gemma 2 are dominating production deployments.",
    featuredImageUrl:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1600&auto=format&fit=crop",
    featuredImageAlt: "Matrix-style data code streams",
    tags: ["AI Tools", "Tech", "Reviews"],
    status: "published",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
    contentHtml: `
<p>In 2023, the prevailing wisdom was simple: bigger is always better. Companies rushed to pipe every simple classification and sentiment task through 100B+ parameter flagship models.</p>

<p>By 2026, the financial and architectural reality has set in. Cloud bills spiked, latency lagged at 1,500ms, and compliance teams balked at sending proprietary PII over external API endpoints. Enter the era of Small Language Models (SLMs).</p>

<h2>The Anatomy of an Efficient SLM</h2>
<p>Models like Microsoft Phi-4 (14B) and Google Gemma 2 (9B) achieve performance on specific domains that rival the giants of two years ago, while fitting comfortably on edge devices or modest GPU clusters.</p>

<blockquote>"You do not need a rocket ship to cross the street. You do not need a 400-billion parameter model to format a date string or extract a JSON payload."</blockquote>

<h2>Latency and Unit Economics</h2>
<p>When running a consumer application with 500,000 daily active users, reducing your per-request latency from 800ms to 45ms translates directly into user retention and a 90% reduction in inference infrastructure costs.</p>
    `,
    faqJson: [
      {
        question: "What is an SLM?",
        answer: "Small Language Models (SLMs) typically have under 15 billion parameters, designed for high efficiency, lower compute requirements, and edge device execution.",
      },
    ],
  },
  {
    id: `post_${nanoid(16)}`,
    title: "ChatGPT vs Claude vs Gemini: Which AI Model is Best for Your Workflow in 2026?",
    slug: "chatgpt-vs-claude-vs-gemini-2026-workflow",
    excerpt:
      "A comprehensive head-to-head comparison evaluating coding precision, context window retention, tool usage, and creative writing quality across the big three LLMs.",
    metaDescription:
      "Direct comparison of ChatGPT, Claude 3.7, and Gemini 2.0 for productivity, coding, and freelance workflows.",
    featuredImageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop",
    featuredImageAlt: "Modern tech setup comparing multiple screens",
    tags: ["Comparisons", "AI Tools", "Tech"],
    status: "published",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    contentHtml: `
<p>In 2026, choosing the right flagship LLM is no longer about arbitrary leaderboard scores. Each of the major model families—OpenAI's ChatGPT, Anthropic's Claude, and Google's Gemini—has cemented distinct strengths and deal-breaking quirks.</p>
<h2>Key Comparison Matrix</h2>
<p>To help you decide which subscription is worth your money, we benchmarked each platform across four rigorous disciplines: software development, nuanced long-form writing, multimodal ingestion, and ecosystem integration.</p>
<h2>1. Claude 3.7: The Precision Instrument for Developers</h2>
<p>For engineering tasks and refactoring complex codebases, Claude remains unmatched in instruction fidelity and minimal hallucination.</p>
<h2>2. ChatGPT Plus: The Conversational Swiss Army Knife</h2>
<p>With Deep Research, Advanced Voice Mode, and extensive custom GPT ecosystems, OpenAI offers the most versatile generalist tool.</p>
<h2>3. Gemini Advanced: The Infinite Context Powerhouse</h2>
<p>With native 2M+ token context windows, Gemini dominates when ingesting hour-long video files, massive PDF archives, and full Git repositories.</p>
    `,
    faqJson: [
      {
        question: "Which model is best for beginners?",
        answer: "ChatGPT provides the most intuitive interface and versatile capabilities for general inquiries and daily productivity.",
      },
    ],
  },
  {
    id: `post_${nanoid(16)}`,
    title: "10 Productivity Tools to Supercharge Your Freelance Workflow",
    slug: "10-productivity-tools-to-supercharge-freelance-workflow",
    excerpt:
      "From time tracking to asynchronous video and intelligent bookkeeping: the essential software stack every independent contractor needs in 2026.",
    metaDescription:
      "10 battle-tested productivity tools for freelancers and independent consultants.",
    featuredImageUrl:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1600&auto=format&fit=crop",
    featuredImageAlt: "Minimalist desk with laptop, notebook, and coffee",
    tags: ["Productivity", "Freelancers", "Reviews"],
    status: "published",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 36), // 36 hours ago
    contentHtml: `
<p>Being a freelancer means you are the CEO, project manager, billing department, and customer support team all at once. Without an airtight software foundation, administrative clutter will quickly cannibalize your creative output.</p>
<h2>1. Raycast: The Keyboard-First Launcher</h2>
<p>Replace Spotlight with a single command palette that handles clipboard history, window management, snippet expansions, and quick AI prompts.</p>
<h2>2. Notion: Unified Knowledge Architecture</h2>
<p>Centralize client deliverables, contract templates, and project roadmaps into a responsive relational database.</p>
<h2>3. Linear: Frictionless Issue Tracking</h2>
<p>Even for solo operators, Linear's keyboard shortcuts and fast issue management keep client deliverables accountable without bloated JIRA overhead.</p>
    `,
    faqJson: [
      {
        question: "Are these tools free to use?",
        answer: "Most of these tools offer generous free tiers suitable for individual freelancers and small agencies.",
      },
    ],
  },
  {
    id: `post_${nanoid(16)}`,
    title: "Best AI Tools for Content Creators in 2026: From Scripting to Final Export",
    slug: "best-ai-tools-for-content-creators-in-2026",
    excerpt:
      "An empirical guide to video editing copilots, synthetic voice synthesis, thumbnail generators, and automated content repurposing pipelines.",
    metaDescription:
      "Top AI tools for modern YouTube creators, podcasters, and newsletter writers in 2026.",
    featuredImageUrl:
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1600&auto=format&fit=crop",
    featuredImageAlt: "Video editing studio with monitors and audio equipment",
    tags: ["AI Tools", "Reviews", "Productivity"],
    status: "published",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    contentHtml: `
<p>Content creation has entered the hyper-compressed production era. Creators who leverage AI for non-creative grunt work—transcription, silence removal, b-roll discovery, and multi-format clipping—are publishing 5x faster with smaller teams.</p>
<h2>1. Descript: Text-Based Audio & Video Editing</h2>
<p>Edit video as easily as editing a Google Doc. Delete filler words, overdub mistakes with AI clone voices, and generate auto-captions with 99% accuracy.</p>
<h2>2. ElevenLabs: Studio-Quality Voice Synthesis</h2>
<p>The definitive gold standard for lifelike multilingual dubbing and narration for documentary-style video content.</p>
    `,
    faqJson: [
      {
        question: "Will AI replace human content creators?",
        answer: "No. AI automates repetitive post-production tasks, but authentic personal storytelling and unique perspectives remain irreplaceable.",
      },
    ],
  },
];

async function run() {
  console.log("Checking and seeding realistic Medium articles...");
  for (const post of SAMPLE_POSTS) {
    const existing = await db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.slug, post.slug))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.posts).values(post);
      console.log(`Inserted: "${post.title}"`);
    } else {
      console.log(`Already exists: "${post.title}"`);
    }
  }
  console.log("Done seeding Medium sample posts!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Error seeding posts:", err);
  process.exit(1);
});
