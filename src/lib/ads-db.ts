import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getOrSetCache, invalidateCacheKey } from "./cache";
import { DBAdPlacement } from "./ads-shared";

export * from "./ads-shared";

export const ADS_CACHE_KEY = "site:ad_placements";

/**
 * Server-only: Fetch all active ad placements and slots from DB (cached with 5-minute TTL, instantly invalidated on save).
 */
export async function getDbAdPlacements(): Promise<Record<string, DBAdPlacement>> {
  try {
    const map = await getOrSetCache<Record<string, DBAdPlacement>>(
      ADS_CACHE_KEY,
      async () => {
        const result: Record<string, DBAdPlacement> = {};

        // 1. Fetch from schema.adSlots (new entity)
        try {
          const slots = await db
            .select()
            .from(schema.adSlots)
            .where(eq(schema.adSlots.status, "active"));

          for (const s of slots) {
            const placement: DBAdPlacement = {
              id: s.id,
              slotKey: s.position, // e.g. "header", "below_title", "in_content", "after_content", "sidebar", "footer"
              title: s.name,
              isEnabled: s.status === "active",
              provider: s.network === "adsense" ? "adsense" : "direct",
              adClient: s.adClient,
              adSlot: s.adSlot,
              customHtml: s.customCode,
              excludeSlugs: (s.excludeSlugs as string[]) || [],
              updatedAt: s.updatedAt,
            };

            result[s.position] = placement;

            // Map aliases for existing theme slots
            if (s.position === "in_content") result["in_article"] = placement;
            if (s.position === "after_content") result["bottom_article"] = placement;
            if (s.position === "sidebar") result["article_sidebar"] = placement;
          }
        } catch (e) {
          // table might be empty or fallback
        }

        // 2. Fetch from legacy schema.adPlacements as fallback
        try {
          const legacy = await db.select().from(schema.adPlacements);
          for (const l of legacy) {
            if (!result[l.slotKey]) {
              result[l.slotKey] = l as DBAdPlacement;
              if (l.slotKey === "in_article" && !result["in_content"]) result["in_content"] = l as DBAdPlacement;
              if (l.slotKey === "bottom_article" && !result["after_content"]) result["after_content"] = l as DBAdPlacement;
              if (l.slotKey === "article_sidebar" && !result["sidebar"]) result["sidebar"] = l as DBAdPlacement;
            }
          }
        } catch (e) {
          // ignore
        }

        return result;
      },
      300 // 5 minutes TTL
    );

    return map || {};
  } catch (err) {
    console.error("[getDbAdPlacements] Failed to load ad placements from DB:", err);
    return {};
  }
}

/**
 * Server-only: Invalidate ad placements cache and revalidate pages.
 */
export async function invalidateAdPlacementsCache(): Promise<void> {
  await invalidateCacheKey(ADS_CACHE_KEY);
}
