import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getOrSetCache, invalidateCacheKey } from "./cache";

export const SITE_SETTINGS_CACHE_KEY = "site:settings:map";

export async function getSiteSettings(): Promise<Record<string, string>> {
  try {
    const map = await getOrSetCache<Record<string, string>>(
      SITE_SETTINGS_CACHE_KEY,
      async () => {
        const records = await db.select().from(schema.siteSettings);
        const res: Record<string, string> = {};
        for (const r of records) {
          res[r.key] = r.value;
        }
        return res;
      },
      300 // 5 minutes TTL
    );
    return map || {};
  } catch (err) {
    console.error("[getSiteSettings] Error loading site settings:", err);
    return {};
  }
}

export async function invalidateSiteSettingsCache(): Promise<void> {
  await invalidateCacheKey(SITE_SETTINGS_CACHE_KEY);
}
