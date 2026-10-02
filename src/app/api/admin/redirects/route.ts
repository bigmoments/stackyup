import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  try {
    const list = await db.select().from(schema.redirects).orderBy(desc(schema.redirects.createdAt));
    return successResponse({ redirects: list });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json();
    const { fromPath, toPath, statusCode } = body;

    if (!fromPath || !toPath) {
      return errorResponse("VALIDATION_ERROR", "fromPath and toPath are required", null, 400);
    }

    const id = `red_${nanoid(10)}`;
    await db.insert(schema.redirects).values({
      id,
      fromPath: fromPath.trim(),
      toPath: toPath.trim(),
      statusCode: statusCode === 302 ? 302 : 301,
    });

    return successResponse({ message: "Redirect created", id });
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

    if (!id) return errorResponse("VALIDATION_ERROR", "Redirect ID is required", null, 400);

    await db.delete(schema.redirects).where(eq(schema.redirects.id, id));
    return successResponse({ message: "Redirect removed" });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}
