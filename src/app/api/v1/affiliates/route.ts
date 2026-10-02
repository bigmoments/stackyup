import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { verifyApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { db, schema } from "@/db";

export interface PublicAffiliate {
  id: string;
  brand: string;
  category: string;
  default_anchor_text: string;
  status: string;
}

const defaultPartners = [
  {
    id: "runpod",
    brand: "RunPod",
    category: "Cloud GPU / AI Infrastructure",
    destination: "https://runpod.io",
    affiliateUrl: "https://runpod.io?ref=stackyup",
    default_anchor_text: "RunPod",
    status: "Active",
  },
  {
    id: "claude",
    brand: "Claude Pro / Anthropic",
    category: "AI LLM",
    destination: "https://anthropic.com/claude",
    affiliateUrl: "https://anthropic.com/?via=stackyup",
    default_anchor_text: "Claude Pro",
    status: "Active",
  },
  {
    id: "notion",
    brand: "Notion AI",
    category: "Productivity",
    destination: "https://notion.so/product/ai",
    affiliateUrl: "https://affiliate.notion.so/stackyup-ai",
    default_anchor_text: "Notion AI",
    status: "Active",
  },
  {
    id: "cursor",
    brand: "Cursor IDE",
    category: "Developer Tool",
    destination: "https://cursor.com",
    affiliateUrl: "https://cursor.com/ref=stackyup",
    default_anchor_text: "Cursor IDE",
    status: "Active",
  },
  {
    id: "perplexity",
    brand: "Perplexity Pro",
    category: "Search AI",
    destination: "https://perplexity.ai/pro",
    affiliateUrl: "https://perplexity.ai/referral/stackyup",
    default_anchor_text: "Perplexity Pro",
    status: "Active",
  },
];

// GET /api/v1/affiliates - List active affiliate partners for AI agents
export async function GET(request: NextRequest) {
  const auth = await verifyApiKey(request);
  if (!auth.authenticated) {
    return errorResponse(
      auth.errorCode || "UNAUTHORIZED",
      auth.error || "Unauthorized",
      auth.details || null,
      auth.statusCode || 401
    );
  }

  try {
    const record = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "affiliate_links"))
      .limit(1);

    let partners = defaultPartners;
    if (record.length > 0 && record[0].value) {
      try {
        const parsed = JSON.parse(record[0].value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          partners = parsed.map((item: any) => ({
            id: item.id.replace(/^aff_/, ""),
            brand: item.brand,
            category: item.category || "AI Tools",
            destination: item.destination || "",
            affiliateUrl: item.affiliateUrl || "",
            default_anchor_text: item.brand,
            status: item.status || "Active",
          }));
        }
      } catch (e) {
        console.error("Error parsing affiliate settings:", e);
      }
    }

    // Filter only active affiliates and expose necessary fields
    const activePartners: PublicAffiliate[] = partners
      .filter((p: any) => p.status === "Active" || p.status === "active")
      .map((p: any) => ({
        id: p.id,
        brand: p.brand,
        category: p.category,
        default_anchor_text: p.default_anchor_text || p.brand,
        status: "Active",
      }));

    return successResponse({
      items: activePartners,
      total: activePartners.length,
    });
  } catch (error) {
    console.error("Error in GET /api/v1/affiliates:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve affiliates", null, 500);
  }
}
