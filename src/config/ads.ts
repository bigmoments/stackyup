export type AdType = "adsense" | "custom" | "none";

export interface CustomAdBanner {
  format?: "image" | "card";
  badge?: string;
  title?: string;
  highlightText?: string;
  description?: string;
  ctaText?: string;
  ctaUrl: string;
  imageUrl?: string;
  theme?: "dark" | "light" | "green";
  showIdeMockup?: boolean;
}

export interface AdSlotConfig {
  enabled: boolean;
  type: AdType;
  // Google AdSense parameters
  adSlot?: string;
  adFormat?: "auto" | "rectangle" | "horizontal" | "vertical" | "fluid";
  fullWidthResponsive?: boolean;
  // Direct / Affiliate promo parameters
  custom?: CustomAdBanner;
}

export interface AdsSystemConfig {
  enabled: boolean;
  adsenseClientId: string;
  slots: {
    sidebar: AdSlotConfig;
    inArticle: AdSlotConfig;
    bottomArticle: AdSlotConfig;
    inFeed: AdSlotConfig;
  };
}

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "";
const globalAdsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED !== "false";
const hasAdSense = Boolean(adsenseClientId && adsenseClientId.trim() !== "");

/**
 * Strict Ad Configuration:
 * "Jika kosong maka tidak perlu tampilkan placeholder"
 * If no real ad is configured (e.g. AdSense client ID is empty and no custom campaign is set),
 * slots are disabled and return null with ZERO placeholder boxes.
 */
export const adsConfig: AdsSystemConfig = {
  enabled: globalAdsEnabled,
  adsenseClientId,
  slots: {
    // 1. Sidebar Slot: If AdSense configured, uses AdSense. Otherwise shows curated showcase if enabled.
    sidebar: {
      enabled: globalAdsEnabled && process.env.NEXT_PUBLIC_ADS_SIDEBAR !== "false",
      type: hasAdSense && process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR ? "adsense" : "custom",
      adSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || "",
      adFormat: "rectangle",
      fullWidthResponsive: true,
      custom: {
        badge: "v0",
        title: "Build what you imagine",
        highlightText: "with AI.",
        description: "Turn your ideas into real apps in minutes.",
        ctaText: "Try v0 for free",
        ctaUrl: "https://v0.dev",
        theme: "dark",
        showIdeMockup: true,
      },
    },

    // 2. In-Article Slot: ONLY active when real AdSense is configured. If empty, NO placeholder is injected.
    inArticle: {
      enabled: hasAdSense && Boolean(process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE) && process.env.NEXT_PUBLIC_ADS_IN_ARTICLE !== "false",
      type: hasAdSense && process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE ? "adsense" : "none",
      adSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE || "",
      adFormat: "fluid",
      fullWidthResponsive: true,
    },

    // 3. Bottom-Article Slot: ONLY active when real AdSense is configured. If empty, NO placeholder is rendered.
    bottomArticle: {
      enabled: hasAdSense && Boolean(process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM_ARTICLE),
      type: hasAdSense && process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM_ARTICLE ? "adsense" : "none",
      adSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM_ARTICLE || "",
      adFormat: "horizontal",
      fullWidthResponsive: true,
    },

    // 4. In-Feed Slot: ONLY active when real AdSense is configured. If empty, NO placeholder is rendered.
    inFeed: {
      enabled: hasAdSense && Boolean(process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED),
      type: hasAdSense && process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED ? "adsense" : "none",
      adSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED || "",
      adFormat: "fluid",
      fullWidthResponsive: true,
    },
  },
};
