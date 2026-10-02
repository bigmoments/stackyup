import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  try {
    const tags = await db
      .select()
      .from(schema.tags)
      .orderBy(desc(schema.tags.articleCount));
    return successResponse({ tags });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json();
    const { name, slug } = body;

    if (!name) return errorResponse("VALIDATION_ERROR", "Tag name is required", null, 400);

    const tagSlug = (slug || name).toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");
    const id = `tag_${nanoid(10)}`;

    await db.insert(schema.tags).values({
      id,
      name: name.trim(),
      slug: tagSlug,
      articleCount: 0,
    });

    return successResponse({ message: "Tag created successfully", id });
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

    if (!id) return errorResponse("VALIDATION_ERROR", "Tag ID is required", null, 400);

    await db.delete(schema.tags).where(eq(schema.tags.id, id));
    return successResponse({ message: "Tag deleted successfully" });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}
