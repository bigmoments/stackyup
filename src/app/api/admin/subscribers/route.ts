import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  try {
    const subscribers = await db
      .select()
      .from(schema.subscribers)
      .orderBy(desc(schema.subscribers.createdAt));
    return successResponse({ subscribers });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source } = body;

    if (!email || !email.includes("@")) {
      return errorResponse("VALIDATION_ERROR", "A valid email is required", null, 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const id = `sub_${nanoid(12)}`;

    await db
      .insert(schema.subscribers)
      .values({
        id,
        email: cleanEmail,
        source: source || "website",
        status: "active",
      })
      .onConflictDoNothing();

    return successResponse({ message: "Subscribed successfully", id });
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

    if (!id) return errorResponse("VALIDATION_ERROR", "Subscriber ID is required", null, 400);

    await db.delete(schema.subscribers).where(eq(schema.subscribers.id, id));
    return successResponse({ message: "Subscriber removed" });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}
