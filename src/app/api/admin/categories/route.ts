import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  try {
    const categories = await db
      .select()
      .from(schema.categories)
      .orderBy(desc(schema.categories.articleCount));
    return successResponse({ categories });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return errorResponse("VALIDATION_ERROR", "Name and slug are required", null, 400);
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");
    const id = `cat_${nanoid(10)}`;

    await db.insert(schema.categories).values({
      id,
      name: name.trim(),
      slug: cleanSlug,
      description: description || null,
      articleCount: 0,
    });

    return successResponse({ message: "Category created successfully", id });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return errorResponse("VALIDATION_ERROR", "Category ID is required", null, 400);

    await db.delete(schema.categories).where(eq(schema.categories.id, id));
    return successResponse({ message: "Category deleted successfully" });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}
