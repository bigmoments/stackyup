import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";

export interface AffiliatePartner {
  id: string;
  brand: string;
  category: string;
  destination: string;
  affiliateUrl: string;
  clicks: number;
  disclosure: string;
  status: "Active" | "Paused";
}

const defaultPartners: AffiliatePartner[] = [
  {
    id: "aff_claude",
    brand: "Claude Pro / Anthropic",
    category: "AI LLM",
    destination: "https://anthropic.com/claude",
    affiliateUrl: "https://anthropic.com/?via=stackyup",
    clicks: 1420,
    disclosure: "Sponsored partner link",
    status: "Active",
  },
  {
    id: "aff_notion",
    brand: "Notion AI",
    category: "Productivity",
    destination: "https://notion.so/product/ai",
    affiliateUrl: "https://affiliate.notion.so/stackyup-ai",
    clicks: 980,
    disclosure: "Affiliate commission link",
    status: "Active",
  },
  {
    id: "aff_perplexity",
    brand: "Perplexity Pro",
    category: "Search AI",
    destination: "https://perplexity.ai/pro",
    affiliateUrl: "https://perplexity.ai/referral/stackyup",
    clicks: 864,
    disclosure: "Affiliate referral link",
    status: "Active",
  },
  {
    id: "aff_cursor",
    brand: "Cursor IDE",
    category: "Developer Tool",
    destination: "https://cursor.com",
    affiliateUrl: "https://cursor.com/ref=stackyup",
    clicks: 1120,
    disclosure: "Partner link",
    status: "Active",
  },
];

async function getAffiliatesList(): Promise<AffiliatePartner[]> {
  const record = await db
    .select()
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.key, "affiliate_links"))
    .limit(1);

  if (record.length > 0 && record[0].value) {
    try {
      return JSON.parse(record[0].value);
    } catch {}
  }
  return defaultPartners;
}

async function saveAffiliatesList(list: AffiliatePartner[]) {
  const existing = await db
    .select()
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.key, "affiliate_links"))
    .limit(1);

  const value = JSON.stringify(list);
  if (existing.length > 0) {
    await db
      .update(schema.siteSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(schema.siteSettings.key, "affiliate_links"));
  } else {
    await db.insert(schema.siteSettings).values({ key: "affiliate_links", value });
  }
}

export async function GET() {
  try {
    const list = await getAffiliatesList();
    return successResponse({ affiliates: list });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json();
    const { id, brand, category, destination, affiliateUrl, disclosure, status, incrementClick } = body;

    const list = await getAffiliatesList();

    // If increment click only
    if (id && incrementClick) {
      const updated = list.map((item) =>
        item.id === id ? { ...item, clicks: item.clicks + 1 } : item
      );
      await saveAffiliatesList(updated);
      return successResponse({ message: "Click recorded", id });
    }

    if (!brand || !affiliateUrl) {
      return errorResponse("VALIDATION_ERROR", "Brand and Affiliate URL are required", null, 400);
    }

    let updatedList: AffiliatePartner[];

    if (id) {
      // Edit existing
      updatedList = list.map((item) =>
        item.id === id
          ? {
              ...item,
              brand,
              category: category || "General",
              destination: destination || affiliateUrl,
              affiliateUrl,
              disclosure: disclosure || "Partner link",
              status: status || "Active",
            }
          : item
      );
    } else {
      // Create new
      const newItem: AffiliatePartner = {
        id: `aff_${nanoid(10)}`,
        brand,
        category: category || "General",
        destination: destination || affiliateUrl,
        affiliateUrl,
        clicks: 0,
        disclosure: disclosure || "Affiliate link",
        status: status || "Active",
      };
      updatedList = [newItem, ...list];
    }

    await saveAffiliatesList(updatedList);
    return successResponse({ message: "Affiliate partner saved successfully", affiliates: updatedList });
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

    if (!id) {
      return errorResponse("VALIDATION_ERROR", "ID is required", null, 400);
    }

    const list = await getAffiliatesList();
    const updated = list.filter((item) => item.id !== id);
    await saveAffiliatesList(updated);

    return successResponse({ message: "Affiliate link deleted successfully", id });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}
