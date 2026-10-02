import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";
import { invalidateAdPlacementsCache } from "@/lib/ads-db";

export async function GET() {
  try {
    const placements = await db.select().from(schema.adPlacements);
    return successResponse({ placements });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json();
    const { slotKey, title, isEnabled, provider, adClient, adSlot, customHtml } = body;

    if (!slotKey) return errorResponse("VALIDATION_ERROR", "Slot key is required", null, 400);

    const existing = await db
      .select()
      .from(schema.adPlacements)
      .where(eq(schema.adPlacements.slotKey, slotKey))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.adPlacements)
        .set({
          title: title || existing[0].title,
          isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : existing[0].isEnabled,
          provider: provider || existing[0].provider,
          adClient: adClient !== undefined ? adClient : existing[0].adClient,
          adSlot: adSlot !== undefined ? adSlot : existing[0].adSlot,
          customHtml: customHtml !== undefined ? customHtml : existing[0].customHtml,
          updatedAt: new Date(),
        })
        .where(eq(schema.adPlacements.slotKey, slotKey));
    } else {
      await db.insert(schema.adPlacements).values({
        id: `ad_${nanoid(10)}`,
        slotKey,
        title: title || slotKey,
        isEnabled: Boolean(isEnabled),
        provider: provider || "adsense",
        adClient: adClient || null,
        adSlot: adSlot || null,
        customHtml: customHtml || null,
      });
    }

    // Invalidate cached placements immediately so live site updates instantly
    await invalidateAdPlacementsCache();

    // Revalidate affected routes
    try {
      revalidatePath("/");
      revalidatePath("/[slug]", "page");
      revalidatePath("/admin/advertisements");
    } catch {
      // outside request context or Edge safety
    }

    return successResponse({ message: "Ad placement updated successfully" });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}
