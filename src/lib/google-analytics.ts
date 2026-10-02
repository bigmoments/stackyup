import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getSiteSettings } from "./site-settings";

interface GA4ReportResult {
  totalViews: number;
  activeUsers: number;
  viewsBySlug: Record<string, number>;
  isLive: boolean;
}

/**
 * Fetches real Google Analytics 4 metrics using Google Analytics Data API.
 * Uses Service Account credentials from environment variables:
 * - GA_CLIENT_EMAIL
 * - GA_PRIVATE_KEY
 * - GA_PROPERTY_ID (or from site_settings)
 */
export async function getGA4AnalyticsReport(): Promise<GA4ReportResult | null> {
  const settings = await getSiteSettings();
  const propertyId = settings.ga_property_id || process.env.GA_PROPERTY_ID;

  let clientEmail = settings.ga_client_email || process.env.GA_CLIENT_EMAIL;
  let rawPrivateKey = settings.ga_private_key || process.env.GA_PRIVATE_KEY;

  // Support pasting the entire service account JSON into settings
  if (settings.ga_service_account_json && settings.ga_service_account_json.trim()) {
    try {
      const parsed = JSON.parse(settings.ga_service_account_json.trim());
      if (parsed.client_email) clientEmail = parsed.client_email;
      if (parsed.private_key) rawPrivateKey = parsed.private_key;
    } catch (e) {
      // ignore JSON parse error
    }
  }

  if (!propertyId || !clientEmail || !rawPrivateKey) {
    return null;
  }

  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

  try {
    // 1. Generate JWT token for Google OAuth2
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const claimSet = {
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    const crypto = await import("crypto");
    const base64Url = (str: string) => Buffer.from(str).toString("base64url");
    const encodedHeader = base64Url(JSON.stringify(header));
    const encodedClaim = base64Url(JSON.stringify(claimSet));
    const unsignedToken = `${encodedHeader}.${encodedClaim}`;

    const sign = crypto.createSign("RSA-SHA256");
    sign.update(unsignedToken);
    sign.end();
    const signature = sign.sign(privateKey, "base64url");
    const jwt = `${unsignedToken}.${signature}`;

    // 2. Exchange JWT for Google Access Token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!tokenRes.ok) {
      console.warn("[GA4] Failed to obtain Google OAuth access token:", await tokenRes.text());
      return null;
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 3. Query Google Analytics Data API: runReport
    const reportRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
          limit: 100,
        }),
      }
    );

    if (!reportRes.ok) {
      console.warn("[GA4] Google Analytics Data API query failed:", await reportRes.text());
      return null;
    }

    const reportData = await reportRes.json();
    let totalViews = 0;
    let activeUsers = 0;
    const viewsBySlug: Record<string, number> = {};

    if (Array.isArray(reportData.rows)) {
      for (const row of reportData.rows) {
        const rawPath = row.dimensionValues?.[0]?.value || "";
        const slug = rawPath.replace(/^\/+|\/+$/g, "");
        const views = parseInt(row.metricValues?.[0]?.value || "0", 10);
        const users = parseInt(row.metricValues?.[1]?.value || "0", 10);

        totalViews += views;
        activeUsers += users;
        if (slug) {
          viewsBySlug[slug] = (viewsBySlug[slug] || 0) + views;
        }
      }
    }

    return {
      totalViews,
      activeUsers,
      viewsBySlug,
      isLive: true,
    };
  } catch (err) {
    console.error("[GA4] Error querying Google Analytics report:", err);
    return null;
  }
}
