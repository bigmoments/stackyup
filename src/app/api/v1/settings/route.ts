import { NextRequest } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { db, schema } from "@/db";

// GET /api/v1/settings - Get site settings (including default_author_name)
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
    const records = await db.select().from(schema.siteSettings);
    const settingsMap: Record<string, string> = {};
    for (const r of records) {
      settingsMap[r.key] = r.value;
    }

    const publicSettings = {
      site_name: settingsMap.site_name || "StackYup",
      site_url: settingsMap.site_url || "https://stackyup.com",
      site_tagline: settingsMap.site_tagline || "Modern AI & Tech Tools for Freelancers",
      default_author_name: settingsMap.default_author_name || "Adit",
      brand_color: settingsMap.brand_color || "#079653",
    };

    return successResponse(publicSettings);
  } catch (error: any) {
    console.error("Error in GET /api/v1/settings:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve site settings", null, 500);
  }
}
