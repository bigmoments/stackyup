import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
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

// PATCH /api/v1/settings - Update site settings
export async function PATCH(request: NextRequest) {
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
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return errorResponse("VALIDATION_ERROR", "Request body must be a valid JSON object", null, 400);
    }

    const allowedKeys = [
      "site_name",
      "site_url",
      "site_tagline",
      "default_author_name",
      "brand_color",
      "meta_description",
      "posts_per_page",
      "logo_url",
      "favicon_url",
    ];

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        const valStr = String(body[key]);
        const existing = await db
          .select()
          .from(schema.siteSettings)
          .where(eq(schema.siteSettings.key, key))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(schema.siteSettings)
            .set({ value: valStr, updatedAt: new Date() })
            .where(eq(schema.siteSettings.key, key));
        } else {
          await db.insert(schema.siteSettings).values({
            key,
            value: valStr,
            updatedAt: new Date(),
          });
        }
      }
    }

    // Retrieve updated settings
    const records = await db.select().from(schema.siteSettings);
    const settingsMap: Record<string, string> = {};
    for (const r of records) {
      settingsMap[r.key] = r.value;
    }

    const updated = {
      site_name: settingsMap.site_name || "StackYup",
      site_url: settingsMap.site_url || "https://stackyup.com",
      site_tagline: settingsMap.site_tagline || "Modern AI & Tech Tools for Freelancers",
      default_author_name: settingsMap.default_author_name || "Adit",
      brand_color: settingsMap.brand_color || "#079653",
      meta_description: settingsMap.meta_description || "",
      posts_per_page: settingsMap.posts_per_page ? parseInt(settingsMap.posts_per_page, 10) : 10,
    };

    return successResponse(updated);
  } catch (error: any) {
    console.error("Error in PATCH /api/v1/settings:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update site settings", null, 500);
  }
}

