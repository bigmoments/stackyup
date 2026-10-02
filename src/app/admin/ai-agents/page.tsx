import fs from "fs";
import path from "path";
import { desc, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { redirect } from "next/navigation";
import AiAgentsClient from "./AiAgentsClient";

export const metadata = {
  title: "AI Agents Hub & Publishing API — StackYup Admin",
  description: "Connect Muse AI, Hermes, OpenClaw, and autonomous agents to StackYup CMS",
};

export const dynamic = "force-dynamic";

export default async function AiAgentsPage() {
  const session = await getCurrentAdmin();
  if (!session) {
    redirect("/admin/login");
  }

  // 1. Fetch all API keys
  const keys = await db
    .select({
      id: schema.apiKeys.id,
      name: schema.apiKeys.name,
      keyPrefix: schema.apiKeys.keyPrefix,
      isActive: schema.apiKeys.isActive,
      lastUsedAt: schema.apiKeys.lastUsedAt,
      createdAt: schema.apiKeys.createdAt,
    })
    .from(schema.apiKeys)
    .orderBy(desc(schema.apiKeys.createdAt));

  // 2. Fetch recent posts for live ingestion stream
  const recentPosts = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      authorName: schema.posts.authorName,
      status: schema.posts.status,
      publishedAt: schema.posts.publishedAt,
      createdAt: schema.posts.createdAt,
    })
    .from(schema.posts)
    .orderBy(desc(schema.posts.createdAt))
    .limit(8);

  // 3. Fetch stored agent settings from site_settings
  const settingsRecords = await db.select().from(schema.siteSettings);
  const settingsMap: Record<string, string> = {};
  settingsRecords.forEach((r) => {
    settingsMap[r.key] = r.value;
  });

  // 4. Count stats
  const totalPostsRes = await db.select({ count: count() }).from(schema.posts);
  const totalMediaRes = await db.select({ count: count() }).from(schema.media);

  // 5. Read AI_AGENT_INTEGRATION.md content
  let agentSpecMarkdown = "";
  try {
    const specPath = path.resolve(process.cwd(), "AI_AGENT_INTEGRATION.md");
    if (fs.existsSync(specPath)) {
      agentSpecMarkdown = fs.readFileSync(specPath, "utf-8");
    }
  } catch {}

  return (
    <AiAgentsClient
      initialKeys={keys.map((k) => ({
        ...k,
        lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
        createdAt: k.createdAt.toISOString(),
      }))}
      recentPosts={recentPosts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        authorName: p.authorName,
        status: p.status,
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
      }))}
      initialSettings={settingsMap}
      stats={{
        totalKeys: keys.length,
        activeKeys: keys.filter((k) => k.isActive).length,
        totalPosts: Number(totalPostsRes[0]?.count || 0),
        totalMedia: Number(totalMediaRes[0]?.count || 0),
      }}
      agentSpecMarkdown={agentSpecMarkdown}
    />
  );
}
