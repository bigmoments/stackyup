import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getCurrentAdmin } from "@/lib/admin-session";
import { generateApiKey } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { db, schema } from "@/db";

// GET /api/admin/api-keys - List keys
export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Admin session required", null, 401);
  }

  try {
    const keys = await db
      .select({
        id: schema.apiKeys.id,
        name: schema.apiKeys.name,
        keyPrefix: schema.apiKeys.keyPrefix,
        isActive: schema.apiKeys.isActive,
        lastUsedAt: schema.apiKeys.lastUsedAt,
        createdAt: schema.apiKeys.createdAt,
      })
      .from(schema.apiKeys)
      .orderBy(desc(schema.apiKeys.createdAt));

    return successResponse({ keys });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve API keys", null, 500);
  }
}

// POST /api/admin/api-keys - Create key
export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Admin session required", null, 401);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name?.trim() || "Automated Publishing Key";

    const { key, keyHash, keyPrefix } = generateApiKey();
    const id = `k_${nanoid(16)}`;

    await db.insert(schema.apiKeys).values({
      id,
      name,
      keyHash,
      keyPrefix,
      isActive: true,
    });

    return successResponse(
      {
        message: "API Key created successfully. Copy it now, it will not be displayed again.",
        id,
        name,
        key, // Plaintext returned ONLY ONCE!
      },
      201
    );
  } catch (error) {
    console.error("Error creating API key:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to generate API key", null, 500);
  }
}
