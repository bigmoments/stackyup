import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

interface PartnerInfo {
  id: string;
  brand: string;
  affiliateUrl: string;
}

const defaultFallbackPartners: Record<string, PartnerInfo> = {
  runpod: { id: "runpod", brand: "RunPod", affiliateUrl: "https://runpod.io?ref=stackyup" },
  claude: { id: "claude", brand: "Claude Pro", affiliateUrl: "https://anthropic.com/?via=stackyup" },
  aff_claude: { id: "aff_claude", brand: "Claude Pro", affiliateUrl: "https://anthropic.com/?via=stackyup" },
  notion: { id: "notion", brand: "Notion AI", affiliateUrl: "https://affiliate.notion.so/stackyup-ai" },
  aff_notion: { id: "aff_notion", brand: "Notion AI", affiliateUrl: "https://affiliate.notion.so/stackyup-ai" },
  cursor: { id: "cursor", brand: "Cursor IDE", affiliateUrl: "https://cursor.com/ref=stackyup" },
  aff_cursor: { id: "aff_cursor", brand: "Cursor IDE", affiliateUrl: "https://cursor.com/ref=stackyup" },
  perplexity: { id: "perplexity", brand: "Perplexity Pro", affiliateUrl: "https://perplexity.ai/referral/stackyup" },
  aff_perplexity: { id: "aff_perplexity", brand: "Perplexity Pro", affiliateUrl: "https://perplexity.ai/referral/stackyup" },
};

/**
 * Checks if raw HTML content contains [affiliate ...] shortcodes.
 */
export function hasAffiliateShortcodes(html: string): boolean {
  if (!html) return false;
  return /\[affiliate\s+id=["']?([^"'\]]+)["']?(?:\s+text=["']?([^"'\]]*)["']?)?\s*\]/i.test(html);
}

/**
 * Expands [affiliate id="..." text="..."] and [img id="..." alt="..." caption="..."] shortcodes.
 * HTML sanitization should run before this function, ensuring generated tags remain intact.
 */
export async function expandShortcodes(html: string): Promise<string> {
  if (!html) return "";

  // 1. Fetch active affiliates from siteSettings if available
  let partnersMap = new Map<string, string>(); // id/normalizedId -> brand name
  try {
    const record = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "affiliate_links"))
      .limit(1);

    if (record.length > 0 && record[0].value) {
      const list = JSON.parse(record[0].value);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item.id && item.brand) {
            partnersMap.set(item.id.toLowerCase(), item.brand);
            // also index without aff_ prefix
            const normalized = item.id.replace(/^aff_/, "").toLowerCase();
            partnersMap.set(normalized, item.brand);
          }
        }
      }
    }
  } catch (e) {
    console.error("Error loading affiliate partners in shortcodes expander:", e);
  }

  // 2. Expand [affiliate id="..." (text="...")] shortcodes
  let expanded = html.replace(
    /\[affiliate\s+id=["']([^"']+)["'](?:\s+text=["']([^"']*)["'])?\s*\]/gi,
    (match, id, text) => {
      const trimmedId = id.trim();
      const normId = trimmedId.toLowerCase().replace(/^aff_/, "");
      const brand =
        partnersMap.get(trimmedId.toLowerCase()) ||
        partnersMap.get(normId) ||
        defaultFallbackPartners[trimmedId.toLowerCase()]?.brand ||
        defaultFallbackPartners[normId]?.brand ||
        trimmedId;

      const anchorText = (text && text.trim()) || brand;
      const redirectUrl = `/api/affiliates/redirect/${encodeURIComponent(trimmedId)}`;

      return `<a href="${redirectUrl}" target="_blank" rel="sponsored nofollow" class="text-[#079653] font-semibold underline underline-offset-2 hover:text-[#057842]">${anchorText}</a>`;
    }
  );

  // 3. Expand [img id="..." (alt="...") (caption="...")] shortcodes
  expanded = expanded.replace(
    /\[img\s+id=["']([^"']+)["'](?:\s+alt=["']([^"']*)["'])?(?:\s+caption=["']([^"']*)["'])?\s*\]/gi,
    (match, id, alt, caption) => {
      const trimmedId = id.trim();
      const cleanAlt = alt ? alt.trim() : "Article illustration";
      const imageUrl = trimmedId.startsWith("http")
        ? trimmedId
        : `/uploads/${trimmedId}.webp`;

      const figCaptionHtml = caption && caption.trim()
        ? `<figcaption class="text-center text-[12px] text-[#8a9099] mt-2 font-sans italic">${caption.trim()}</figcaption>`
        : "";

      return `<figure class="my-8">
  <div className="overflow-hidden rounded-[10px] bg-[#f8faf9] border border-[#e6ebe8]">
    <img src="${imageUrl}" alt="${cleanAlt}" loading="lazy" class="w-full rounded-[10px]" />
  </div>
  ${figCaptionHtml}
</figure>`;
    }
  );

  return expanded;
}
