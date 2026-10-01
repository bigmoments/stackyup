import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { createAdminSession } from "@/lib/admin-session";
import { errorResponse, successResponse } from "@/lib/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("VALIDATION_ERROR", "Email and password are required", null, 422);
    }

    const matchedAdmins = await db
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.email, email.toLowerCase().trim()))
      .limit(1);

    if (matchedAdmins.length === 0) {
      return errorResponse("UNAUTHORIZED", "Invalid email or password", null, 401);
    }

    const admin = matchedAdmins[0];
    const passwordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordValid) {
      return errorResponse("UNAUTHORIZED", "Invalid email or password", null, 401);
    }

    await createAdminSession(admin.email);

    return successResponse({
      message: "Login successful",
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to login", null, 500);
  }
}
