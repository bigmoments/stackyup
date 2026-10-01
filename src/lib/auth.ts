import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/db";

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(prefix = "sy_live_"): { key: string; keyHash: string; keyPrefix: string } {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  const key = `${prefix}${randomBytes}`;
  const keyHash = hashApiKey(key);
  return { key, keyHash, keyPrefix: prefix };
}

export interface AuthResult {
  authenticated: boolean;
  name?: string;
  keyId?: string;
  error?: string;
}

export async function verifyApiKey(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");

  if (!authHeader) {
    return { authenticated: false, error: "Missing Authorization header" };
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return { authenticated: false, error: "Invalid Authorization header format. Expected 'Bearer <API_KEY>'" };
  }

  const rawKey = parts[1].trim();

  // 1. Check against process.env.CMS_API_KEY if configured
  const envKey = process.env.CMS_API_KEY;
  if (envKey && rawKey === envKey) {
    return { authenticated: true, name: "Environment Master Key" };
  }

  // 2. Check against database api_keys table
  const keyHash = hashApiKey(rawKey);

  try {
    const matchedKeys = await db
      .select()
      .from(schema.apiKeys)
      .where(and(eq(schema.apiKeys.keyHash, keyHash), eq(schema.apiKeys.isActive, true)))
      .limit(1);

    if (matchedKeys.length === 0) {
      return { authenticated: false, error: "Invalid or revoked API key" };
    }

    const matchedKey = matchedKeys[0];

    // Asynchronously update lastUsedAt
    db.update(schema.apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(schema.apiKeys.id, matchedKey.id))
      .catch((err) => console.error("Failed to update last_used_at for key:", err));

    return {
      authenticated: true,
      name: matchedKey.name,
      keyId: matchedKey.id,
    };
  } catch (error) {
    console.error("Auth database verification error:", error);
    return { authenticated: false, error: "Authentication service error" };
  }
}
