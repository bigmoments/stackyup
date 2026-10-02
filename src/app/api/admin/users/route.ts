import { NextRequest } from "next/server";
import { eq, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { db, schema } from "@/db";
import { getCurrentAdmin } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const admins = await db
      .select({
        id: schema.admins.id,
        email: schema.admins.email,
        role: schema.admins.role,
        createdAt: schema.admins.createdAt,
      })
      .from(schema.admins);

    return successResponse({ admins, currentEmail: session.email });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json();
    const { email, password, role = "admin" } = body;

    if (!email || !password || typeof password !== "string" || password.length < 6) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Email and password (min 6 chars) are required",
        null,
        400
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate
    const existing = await db
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return errorResponse("CONFLICT", "An admin user with this email already exists", null, 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newId = `adm_${nanoid(16)}`;

    await db.insert(schema.admins).values({
      id: newId,
      email: normalizedEmail,
      passwordHash,
      role,
    });

    return successResponse({
      message: "Admin user created successfully",
      admin: { id: newId, email: normalizedEmail, role, createdAt: new Date() },
    });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentAdmin();
    if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", null, 401);

    const body = await request.json();
    const { id, newPassword, role } = body;

    if (!id) {
      return errorResponse("VALIDATION_ERROR", "User ID is required", null, 400);
    }

    const updateData: Record<string, any> = {};

    if (newPassword) {
      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return errorResponse("VALIDATION_ERROR", "Password must be at least 6 characters", null, 400);
      }
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    if (role) {
      updateData.role = role;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("VALIDATION_ERROR", "Nothing to update", null, 400);
    }

    await db.update(schema.admins).set(updateData).where(eq(schema.admins.id, id));

    return successResponse({ message: "Admin credentials updated successfully" });
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

    if (!id) {
      return errorResponse("VALIDATION_ERROR", "User ID is required", null, 400);
    }

    // Check if target user is self
    const target = await db
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.id, id))
      .limit(1);

    if (target.length === 0) {
      return errorResponse("NOT_FOUND", "Admin not found", null, 404);
    }

    if (target[0].email.toLowerCase() === session.email.toLowerCase()) {
      return errorResponse("FORBIDDEN", "You cannot delete your own logged-in admin account", null, 403);
    }

    await db.delete(schema.admins).where(eq(schema.admins.id, id));

    return successResponse({ message: "Admin user removed successfully", id });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, null, 500);
  }
}
