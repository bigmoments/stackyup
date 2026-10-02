import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import AffiliatesClient from "./AffiliatesClient";
import { AffiliatePartner } from "@/app/api/admin/affiliates/route";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Affiliate Links — StackYup Admin",
};

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

export default async function AdminAffiliatesPage() {
  const record = await db
    .select()
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.key, "affiliate_links"))
    .limit(1);

  let partners: AffiliatePartner[] = defaultPartners;
  if (record.length > 0 && record[0].value) {
    try {
      partners = JSON.parse(record[0].value);
    } catch {}
  }

  return <AffiliatesClient initialAffiliates={partners} />;
}
