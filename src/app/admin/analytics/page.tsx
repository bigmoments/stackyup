import { count, eq, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { getGA4AnalyticsReport } from "@/lib/google-analytics";
import AnalyticsClient, { AnalyticsPostSummary } from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics — StackYup Admin",
};

export default async function AdminAnalyticsPage() {
  const [
    allPosts,
    subscribersCount,
    commentsCount,
    settingsRecords,
    gaReport,
  ] = await Promise.all([
    db.select().from(schema.posts).catch(() => []),
    db.select({ count: count() }).from(schema.subscribers).catch(() => [{ count: 0 }]),
    db.select({ count: count() }).from(schema.comments).catch(() => [{ count: 0 }]),
    db.select().from(schema.siteSettings).catch(() => []),
    getGA4AnalyticsReport().catch(() => null),
  ]);

  const map = new Map(settingsRecords.map((r) => [r.key, r.value]));
  const initialGaId = map.get("google_analytics_id") || "";
  const initialPlausible = map.get("plausible_domain") || "";

  const publishedPosts = allPosts.filter((p) => p.status === "published");
  const draftPosts = allPosts.filter((p) => p.status === "draft");

  const totalClaps = allPosts.reduce((sum, p) => sum + (p.claps || 0), 0);
  const estimatedViews = gaReport?.totalViews ?? allPosts.reduce(
    (sum, p) => sum + (p.views || (p.claps || 0) * 14 + (p.status === "published" ? 120 : 0)),
    0
  );

  const topPosts: AnalyticsPostSummary[] = publishedPosts
    .sort((a, b) => {
      const bViews = gaReport?.viewsBySlug?.[b.slug] ?? (b.views || (b.claps || 0) * 14 + 120);
      const aViews = gaReport?.viewsBySlug?.[a.slug] ?? (a.views || (a.claps || 0) * 14 + 120);
      return bViews - aViews;
    })
    .slice(0, 10)
    .map((p) => {
      const tags = (p.tags as string[]) || [];
      const postViews = gaReport?.viewsBySlug?.[p.slug] ?? (p.views || (p.claps || 0) * 14 + 120);

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        category: tags[0] || "General",
        claps: p.claps || 0,
        estimatedViews: postViews,
        comments: 0,
        publishedAt: p.publishedAt
          ? new Date(p.publishedAt).toLocaleDateString()
          : new Date(p.createdAt).toLocaleDateString(),
      };
    });

  return (
    <AnalyticsClient
      stats={{
        totalPosts: allPosts.length,
        totalPublished: publishedPosts.length,
        totalDrafts: draftPosts.length,
        totalClaps,
        estimatedViews,
        totalComments: commentsCount[0]?.count || 0,
        totalSubscribers: subscribersCount[0]?.count || 0,
      }}
      topPosts={topPosts}
      initialGaId={initialGaId}
      initialPlausible={initialPlausible}
    />
  );
}
