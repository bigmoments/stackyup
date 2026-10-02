import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getOptimizedImageUrl } from "@/lib/storage";

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

  // 1. Fetch active affiliates from schema.affiliates (primary) and siteSettings (fallback)
  let partnersMap = new Map<string, { brand: string; status: string }>();
  try {
    const affiliateRecords = await db
      .select()
      .from(schema.affiliates);

    for (const a of affiliateRecords) {
      if (a.id && a.brand) {
        const item = { brand: a.brand, status: a.status };
        partnersMap.set(a.id.toLowerCase(), item);
        partnersMap.set(a.id.replace(/^aff_/, "").toLowerCase(), item);
      }
    }
  } catch (e) {
    // schema.affiliates might be empty or fallback
  }

  // Also read legacy siteSettings affiliate_links if any
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
          if (item.id && item.brand && !partnersMap.has(item.id.toLowerCase())) {
            const data = { brand: item.brand, status: item.status || "active" };
            partnersMap.set(item.id.toLowerCase(), data);
            partnersMap.set(item.id.replace(/^aff_/, "").toLowerCase(), data);
          }
        }
      }
    }
  } catch (e) {
    console.error("Error loading legacy affiliate partners:", e);
  }

  // 2. Expand [affiliate id="..." (text="...")] shortcodes
  let expanded = html.replace(
    /\[affiliate\s+id=["']([^"']+)["'](?:\s+text=["']([^"']*)["'])?\s*\]/gi,
    (match, id, text) => {
      const trimmedId = id.trim();
      const normId = trimmedId.toLowerCase().replace(/^aff_/, "");
      
      const partner = partnersMap.get(trimmedId.toLowerCase()) || partnersMap.get(normId);

      // Graceful fallback: If deleted, inactive, or not found, render anchor text or brand as clean plain text
      if (!partner && !defaultFallbackPartners[trimmedId.toLowerCase()] && !defaultFallbackPartners[normId]) {
        return (text && text.trim()) || trimmedId;
      }

      if (partner && partner.status !== "active") {
        return (text && text.trim()) || partner.brand;
      }

      const brand =
        partner?.brand ||
        defaultFallbackPartners[trimmedId.toLowerCase()]?.brand ||
        defaultFallbackPartners[normId]?.brand ||
        trimmedId;

      const anchorText = (text && text.trim()) || brand;
      const redirectUrl = `/api/affiliates/redirect/${encodeURIComponent(trimmedId)}`;

      return `<a href="${redirectUrl}" target="_blank" rel="sponsored nofollow" class="text-[#079653] font-semibold underline underline-offset-2 hover:text-[#057842]">${anchorText}</a>`;
    }
  );

  // 3. Collect media IDs from [img id="..."] shortcodes and resolve URLs
  const imgMatches = Array.from(
    html.matchAll(/\[img\s+id=["']([^"']+)["']/gi)
  );
  const mediaMap = new Map<string, string>(); // id -> url

  if (imgMatches.length > 0) {
    try {
      const mediaRecords = await db.select().from(schema.media);
      for (const m of mediaRecords) {
        if (m.id && m.url) {
          mediaMap.set(m.id, m.url);
        }
      }
    } catch (e) {
      console.error("Error loading media records in shortcodes expander:", e);
    }
  }

  // 4. Expand [img id="..." (alt="...") (caption="...")] shortcodes
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudFolder = process.env.CLOUDINARY_FOLDER || "stackyup";

  expanded = expanded.replace(
    /\[img\s+id=["']([^"']+)["'](?:\s+alt=["']([^"']*)["'])?(?:\s+caption=["']([^"']*)["'])?\s*\]/gi,
    (match, id, alt, caption) => {
      const trimmedId = id.trim();
      const cleanAlt = alt ? alt.trim() : "Article illustration";
      
      let imageUrl = "";
      if (trimmedId.startsWith("http")) {
        imageUrl = getOptimizedImageUrl(trimmedId);
      } else if (mediaMap.has(trimmedId)) {
        imageUrl = getOptimizedImageUrl(mediaMap.get(trimmedId)!);
      } else if (cloudName) {
        // Resolve directly from Cloudinary CDN with f_auto,q_auto delivery optimization
        imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${cloudFolder}/${trimmedId}.webp`;
      } else {
        imageUrl = `/uploads/${trimmedId}.webp`;
      }

      const figCaptionHtml = caption && caption.trim()
        ? `<figcaption class="text-center text-[12px] text-[#8a9099] mt-2 font-sans italic">${caption.trim()}</figcaption>`
        : "";

      return `<figure class="my-8">
  <div class="overflow-hidden rounded-[10px] bg-[#f8faf9] border border-[#e6ebe8]">
    <img src="${imageUrl}" alt="${cleanAlt}" loading="lazy" class="w-full rounded-[10px]" onerror="this.onerror=null; this.parentElement.parentElement.style.display='none';" />
  </div>
  ${figCaptionHtml}
</figure>`;
    }
  );

  return expanded;
}
