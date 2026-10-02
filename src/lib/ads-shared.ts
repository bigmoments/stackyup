import { adsConfig, AdSlotConfig } from "@/config/ads";

export interface DBAdPlacement {
  id: string;
  slotKey: string;
  title: string;
  isEnabled: boolean;
  provider: "adsense" | "direct";
  adClient?: string | null;
  adSlot?: string | null;
  customHtml?: string | null;
  excludeSlugs?: string[] | null;
  updatedAt?: Date | string;
}

export interface DirectPromoConfig {
  format?: "image" | "card";
  badge?: string;
  title?: string;
  highlightText?: string;
  description?: string;
  ctaText?: string;
  ctaUrl: string;
  imageUrl?: string;
  showIdeMockup?: boolean;
}

/**
 * Helper to parse customHtml field as JSON for structured Direct promo cards or banner images,
 * or return as raw HTML string if not JSON.
 */
export function parseCustomAdContent(customHtml?: string | null): {
  isStructured: boolean;
  promo?: DirectPromoConfig;
  rawHtml?: string;
} {
  if (!customHtml || !customHtml.trim()) {
    return { isStructured: false };
  }

  const trimmed = customHtml.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed) as DirectPromoConfig;
      // Valid if it has title OR imageUrl
      if (parsed.title || parsed.imageUrl) {
        return { isStructured: true, promo: parsed };
      }
    } catch {
      // not JSON, fallback to raw HTML
    }
  }

  return { isStructured: false, rawHtml: trimmed };
}

/**
 * Resolve the dynamic ad slot config for a given slot key
 * (e.g. "article_sidebar", "in_article", "bottom_article", "homepage_sidebar").
 * Fallback to static adsConfig if DB record doesn't exist.
 */
export function resolveSlotConfig(
  slotKey: string,
  dbPlacement?: DBAdPlacement
): {
  enabled: boolean;
  type: "adsense" | "custom" | "none";
  adSlot?: string;
  adClient?: string;
  custom?: AdSlotConfig["custom"];
  customHtml?: string;
} {
  const staticSlotKey =
    slotKey === "in_article" || slotKey === "in_content"
      ? "inArticle"
      : slotKey === "bottom_article" || slotKey === "after_content"
      ? "bottomArticle"
      : slotKey === "homepage_sidebar"
      ? "inFeed"
      : slotKey === "header"
      ? "topHeader"
      : slotKey === "footer"
      ? "bottomArticle"
      : slotKey === "below_title"
      ? "inArticle"
      : "sidebar";

  const fallback = adsConfig.slots[staticSlotKey as keyof typeof adsConfig.slots] || adsConfig.slots.sidebar;

  // If no DB record is stored yet, use the static config default
  if (!dbPlacement) {
    return {
      enabled: fallback.enabled,
      type: fallback.type,
      adSlot: fallback.adSlot,
      adClient: adsConfig.adsenseClientId,
      custom: fallback.custom,
    };
  }

  // If disabled in DB
  if (!dbPlacement.isEnabled) {
    return {
      enabled: false,
      type: "none",
    };
  }

  if (dbPlacement.provider === "adsense") {
    const client = dbPlacement.adClient || adsConfig.adsenseClientId;
    const slot = dbPlacement.adSlot || fallback.adSlot;
    if (!client || !slot) {
      return { enabled: false, type: "none" };
    }
    return {
      enabled: true,
      type: "adsense",
      adClient: client,
      adSlot: slot,
    };
  }

  // Provider is "direct"
  const parsed = parseCustomAdContent(dbPlacement.customHtml);
  if (parsed.isStructured && parsed.promo) {
    return {
      enabled: true,
      type: "custom",
      custom: {
        format: parsed.promo.format || (parsed.promo.imageUrl && !parsed.promo.title ? "image" : "card"),
        badge: parsed.promo.badge || "Sponsored",
        title: parsed.promo.title || "",
        highlightText: parsed.promo.highlightText,
        description: parsed.promo.description || "",
        ctaText: parsed.promo.ctaText || "Learn More",
        ctaUrl: parsed.promo.ctaUrl || "#",
        imageUrl: parsed.promo.imageUrl,
        showIdeMockup: parsed.promo.showIdeMockup ?? false,
      },
    };
  }

  if (parsed.rawHtml) {
    return {
      enabled: true,
      type: "custom",
      customHtml: parsed.rawHtml,
    };
  }

  // Fallback to static custom if custom banner is empty in DB
  return {
    enabled: Boolean(fallback.custom),
    type: fallback.custom ? "custom" : "none",
    custom: fallback.custom,
  };
}
