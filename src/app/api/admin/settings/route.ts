import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  try {
    const records = await db.select().from(schema.siteSettings);
    const settings: Record<string, string> = {};
    for (const r of records) {
      settings[r.key] = r.value;
    }
    return successResponse({ settings });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json(); // key-value map e.g. { site_name: "StackYup", ... }

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") {
        const existing = await db
          .select()
          .from(schema.siteSettings)
          .where(eq(schema.siteSettings.key, key))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(schema.siteSettings)
            .set({ value, updatedAt: new Date() })
            .where(eq(schema.siteSettings.key, key));
        } else {
          await db.insert(schema.siteSettings).values({
            key,
            value,
          });
        }

        // When updating default_author_name, automatically sync authors table
        if (key === "default_author_name" && value.trim()) {
          try {
            await db.update(schema.authors).set({ isDefault: false });
            await db
              .update(schema.authors)
              .set({ isDefault: true })
              .where(eq(schema.authors.name, value.trim()));
          } catch (e) {
            // Ignore if authors table not ready
          }
        }
      }
    }

    try {
      const { invalidateSiteSettingsCache } = await import("@/lib/site-settings");
      await invalidateSiteSettingsCache();
    } catch (e) {
      // ignore
    }

    return successResponse({ message: "Settings saved successfully" });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}
