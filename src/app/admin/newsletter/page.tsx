import { count, eq, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import NewsletterClient, { NewsletterCampaign } from "./NewsletterClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Newsletter Campaigns — StackYup Admin",
};

export default async function AdminNewsletterPage() {
  const [subsCount, recentPosts, settingsRecord] = await Promise.all([
    db
      .select({ count: count() })
      .from(schema.subscribers)
      .where(eq(schema.subscribers.status, "active"))
      .catch(() => [{ count: 0 }]),
    db
      .select({ title: schema.posts.title, slug: schema.posts.slug })
      .from(schema.posts)
      .where(eq(schema.posts.status, "published"))
      .orderBy(desc(schema.posts.publishedAt))
      .limit(5)
      .catch(() => []),
    db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "newsletter_campaigns"))
      .limit(1)
      .catch(() => []),
  ]);

  const activeSubscribers = subsCount[0]?.count || 0;

  let campaigns: NewsletterCampaign[] = [];
  if (settingsRecord.length > 0 && settingsRecord[0].value) {
    try {
      campaigns = JSON.parse(settingsRecord[0].value);
    } catch {}
  } else {
    campaigns = [
      {
        id: "camp_1",
        subject: "StackYup Weekly #1: The 7 AI Tools Transforming Freelancing in 2026",
        previewText: "Discover top AI productivity boosters tested for developers and creators",
        content: "<p>Welcome to this week's issue of StackYup Editorial Digest!</p>",
        sentDate: "Oct 1, 2026",
        recipients: activeSubscribers,
        openRate: "48.2%",
        clicks: "18.4%",
        status: "Sent",
      },
    ];
  }

  return (
    <NewsletterClient
      activeSubscribers={activeSubscribers}
      initialCampaigns={campaigns}
      recentPosts={recentPosts}
    />
  );
}
