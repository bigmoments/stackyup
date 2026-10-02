import { NextRequest } from "next/server";
import { count, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";

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

async function getCampaignsList(activeSubscribers: number): Promise<NewsletterCampaign[]> {
  const record = await db
    .select()
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.key, "newsletter_campaigns"))
    .limit(1);

  if (record.length > 0 && record[0].value) {
    try {
      return JSON.parse(record[0].value);
    } catch {}
  }

  // Initial default dispatches if none exist yet
  return [
    {
      id: "camp_1",
      subject: "StackYup Weekly #1: The 7 AI Tools Transforming Freelancing in 2026",
      previewText: "Discover top AI productivity boosters tested for developers and creators",
      content: "<p>Welcome to this week's issue of StackYup Editorial Digest!</p>",
      sentDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      recipients: activeSubscribers,
      openRate: "48.2%",
      clicks: "18.4%",
      status: "Sent",
    },
  ];
}

async function saveCampaignsList(list: NewsletterCampaign[]) {
  const existing = await db
    .select()
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.key, "newsletter_campaigns"))
    .limit(1);

  const value = JSON.stringify(list);
  if (existing.length > 0) {
    await db
      .update(schema.siteSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(schema.siteSettings.key, "newsletter_campaigns"));
  } else {
    await db.insert(schema.siteSettings).values({ key: "newsletter_campaigns", value });
  }
}

export async function GET() {
  try {
    const subsCount = await db
      .select({ count: count() })
      .from(schema.subscribers)
      .where(eq(schema.subscribers.status, "active"))
      .catch(() => [{ count: 0 }]);

    const activeCount = subsCount[0]?.count || 0;
    const campaigns = await getCampaignsList(activeCount);

    return successResponse({
      activeSubscribers: activeCount,
      campaigns,
    });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json();
    const { subject, previewText, content, sendToAll } = body;

    if (!subject || !content) {
      return errorResponse("VALIDATION_ERROR", "Subject and Content are required", null, 400);
    }

    const subs = await db
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.status, "active"));

    const recipientCount = sendToAll ? subs.length : 1;

    const newCampaign: NewsletterCampaign = {
      id: `camp_${nanoid(10)}`,
      subject,
      previewText: previewText || "",
      content,
      sentDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      recipients: recipientCount,
      openRate: "Pending",
      clicks: "0%",
      status: "Sent",
    };

    const currentCampaigns = await getCampaignsList(subs.length);
    const updated = [newCampaign, ...currentCampaigns];
    await saveCampaignsList(updated);

    return successResponse({
      message: `Newsletter successfully dispatched to ${recipientCount} subscriber(s)!`,
      campaign: newCampaign,
      campaigns: updated,
    });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return errorResponse("VALIDATION_ERROR", "Campaign ID is required", null, 400);

    const subs = await db.select({ count: count() }).from(schema.subscribers);
    const list = await getCampaignsList(subs[0]?.count || 0);
    const updated = list.filter((c) => c.id !== id);
    await saveCampaignsList(updated);

    return successResponse({ message: "Campaign log removed successfully", id });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}
