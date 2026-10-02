import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  try {
    const authorsList = await db
      .select()
      .from(schema.authors)
      .orderBy(desc(schema.authors.isDefault), desc(schema.authors.createdAt));
    return successResponse({ authors: authorsList });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json();
    const {
      name,
      slug,
      role,
      bio,
      avatarUrl,
      websiteUrl,
      twitterHandle,
      isDefault,
    } = body;

    if (!name?.trim()) {
      return errorResponse("VALIDATION_ERROR", "Author name is required", null, 400);
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const id = `auth_${nanoid(10)}`;

    // If setting as default, clear other defaults
    if (isDefault) {
      await db
        .update(schema.authors)
        .set({ isDefault: false });

      // Also update siteSettings default_author_name
      const existingSetting = await db
        .select()
        .from(schema.siteSettings)
        .where(eq(schema.siteSettings.key, "default_author_name"))
        .limit(1);

      if (existingSetting.length > 0) {
        await db
          .update(schema.siteSettings)
          .set({ value: name.trim(), updatedAt: new Date() })
          .where(eq(schema.siteSettings.key, "default_author_name"));
      } else {
        await db.insert(schema.siteSettings).values({
          key: "default_author_name",
          value: name.trim(),
        });
      }
    }

    await db.insert(schema.authors).values({
      id,
      name: name.trim(),
      slug: cleanSlug,
      role: role?.trim() || null,
      bio: bio?.trim() || null,
      avatarUrl: avatarUrl?.trim() || null,
      websiteUrl: websiteUrl?.trim() || null,
      twitterHandle: twitterHandle?.trim() || null,
      isDefault: Boolean(isDefault),
      articleCount: 0,
    });

    return successResponse({ message: "Author created successfully", id, name });
  } catch (err: any) {
    console.error("Create author error:", err);
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json();
    const {
      id,
      name,
      slug,
      role,
      bio,
      avatarUrl,
      websiteUrl,
      twitterHandle,
      isDefault,
    } = body;

    if (!id || !name?.trim()) {
      return errorResponse("VALIDATION_ERROR", "Author ID and name are required", null, 400);
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // If setting as default, clear other defaults
    if (isDefault) {
      await db
        .update(schema.authors)
        .set({ isDefault: false });

      // Also update siteSettings default_author_name
      const existingSetting = await db
        .select()
        .from(schema.siteSettings)
        .where(eq(schema.siteSettings.key, "default_author_name"))
        .limit(1);

      if (existingSetting.length > 0) {
        await db
          .update(schema.siteSettings)
          .set({ value: name.trim(), updatedAt: new Date() })
          .where(eq(schema.siteSettings.key, "default_author_name"));
      } else {
        await db.insert(schema.siteSettings).values({
          key: "default_author_name",
          value: name.trim(),
        });
      }
    }

    await db
      .update(schema.authors)
      .set({
        name: name.trim(),
        slug: cleanSlug,
        role: role?.trim() || null,
        bio: bio?.trim() || null,
        avatarUrl: avatarUrl?.trim() || null,
        websiteUrl: websiteUrl?.trim() || null,
        twitterHandle: twitterHandle?.trim() || null,
        isDefault: Boolean(isDefault),
        updatedAt: new Date(),
      })
      .where(eq(schema.authors.id, id));

    return successResponse({ message: "Author updated successfully" });
  } catch (err: any) {
    console.error("Update author error:", err);
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return errorResponse("VALIDATION_ERROR", "Author ID is required", null, 400);

    const author = await db
      .select()
      .from(schema.authors)
      .where(eq(schema.authors.id, id))
      .limit(1);

    if (author.length === 0) {
      return errorResponse("NOT_FOUND", "Author not found", null, 404);
    }

    if (author[0].isDefault) {
      return errorResponse(
        "CONFLICT",
        "Cannot delete the default author persona. Please assign another default first.",
        null,
        400
      );
    }

    await db.delete(schema.authors).where(eq(schema.authors.id, id));
    return successResponse({ message: "Author deleted successfully" });
  } catch (err: any) {
    console.error("Delete author error:", err);
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}
