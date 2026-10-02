import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db, schema } from "@/db";

interface PartnerRecord {
  id: string;
  brand: string;
  category?: string;
  destination?: string;
  affiliateUrl: string;
  clicks: number;
  disclosure?: string;
  status?: string;
}

const defaultPartners: PartnerRecord[] = [
  {
    id: "runpod",
    brand: "RunPod",
    destination: "https://runpod.io",
    affiliateUrl: "https://runpod.io?ref=stackyup",
    clicks: 1420,
    status: "Active",
  },
  {
    id: "claude",
    brand: "Claude Pro / Anthropic",
    destination: "https://anthropic.com/claude",
    affiliateUrl: "https://anthropic.com/?via=stackyup",
    clicks: 1420,
    status: "Active",
  },
  {
    id: "aff_claude",
    brand: "Claude Pro / Anthropic",
    destination: "https://anthropic.com/claude",
    affiliateUrl: "https://anthropic.com/?via=stackyup",
    clicks: 1420,
    status: "Active",
  },
  {
    id: "notion",
    brand: "Notion AI",
    destination: "https://notion.so/product/ai",
    affiliateUrl: "https://affiliate.notion.so/stackyup-ai",
    clicks: 980,
    status: "Active",
  },
  {
    id: "aff_notion",
    brand: "Notion AI",
    destination: "https://notion.so/product/ai",
    affiliateUrl: "https://affiliate.notion.so/stackyup-ai",
    clicks: 980,
    status: "Active",
  },
  {
    id: "perplexity",
    brand: "Perplexity Pro",
    destination: "https://perplexity.ai/pro",
    affiliateUrl: "https://perplexity.ai/referral/stackyup",
    clicks: 864,
    status: "Active",
  },
  {
    id: "aff_perplexity",
    brand: "Perplexity Pro",
    destination: "https://perplexity.ai/pro",
    affiliateUrl: "https://perplexity.ai/referral/stackyup",
    clicks: 864,
    status: "Active",
  },
  {
    id: "cursor",
    brand: "Cursor IDE",
    destination: "https://cursor.com",
    affiliateUrl: "https://cursor.com/ref=stackyup",
    clicks: 1120,
    status: "Active",
  },
  {
    id: "aff_cursor",
    brand: "Cursor IDE",
    destination: "https://cursor.com",
    affiliateUrl: "https://cursor.com/ref=stackyup",
    clicks: 1120,
    status: "Active",
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const targetId = decodeURIComponent(id || "").trim().toLowerCase();

  let partnerUrl = "https://stackyup.com";
  let found = false;

  try {
    // 1. Check dedicated schema.affiliates table first
    const dbAffiliate = await db
      .select()
      .from(schema.affiliates)
      .where(or(eq(schema.affiliates.id, targetId), eq(schema.affiliates.id, `aff_${targetId}`)))
      .limit(1);

    if (dbAffiliate.length > 0 && dbAffiliate[0].url) {
      return NextResponse.redirect(dbAffiliate[0].url, 307);
    }

    const record = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "affiliate_links"))
      .limit(1);

    let partnersList: PartnerRecord[] = defaultPartners;
    if (record.length > 0 && record[0].value) {
      try {
        const parsed = JSON.parse(record[0].value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          partnersList = parsed;
        }
      } catch {}
    }

    // Match by exact id or normalized id without aff_
    const matchIndex = partnersList.findIndex(
      (p) =>
        p.id.toLowerCase() === targetId ||
        p.id.toLowerCase() === `aff_${targetId}` ||
        p.id.toLowerCase().replace(/^aff_/, "") === targetId
    );

    if (matchIndex >= 0) {
      const partner = partnersList[matchIndex];
      partnerUrl = partner.affiliateUrl || partner.destination || partnerUrl;
      found = true;

      // Increment click count asynchronously in background
      partnersList[matchIndex].clicks = (partner.clicks || 0) + 1;
      const updatedValue = JSON.stringify(partnersList);
      if (record.length > 0) {
        await db
          .update(schema.siteSettings)
          .set({ value: updatedValue, updatedAt: new Date() })
          .where(eq(schema.siteSettings.key, "affiliate_links"));
      } else {
        await db.insert(schema.siteSettings).values({
          key: "affiliate_links",
          value: updatedValue,
        });
      }
    }
  } catch (err) {
    console.error("Error in affiliate redirect:", err);
  }

  // Fallback to default list if not matched in DB
  if (!found) {
    const fallback = defaultPartners.find(
      (p) =>
        p.id.toLowerCase() === targetId ||
        p.id.toLowerCase().replace(/^aff_/, "") === targetId
    );
    if (fallback) {
      partnerUrl = fallback.affiliateUrl;
    }
  }

  return NextResponse.redirect(partnerUrl, 307);
}
