import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/db";
import { checkRateLimit, RateLimitResult } from "./rate-limiter";
import { ApiErrorCode } from "./response";

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
  statusCode?: number;
  errorCode?: ApiErrorCode;
  name?: string;
  keyId?: string;
  error?: string;
  details?: Record<string, unknown> | null;
  rateLimit?: RateLimitResult;
}

// Cookie parser helper
function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Admin session verification helper (works standalone in API routes)
function verifyAdminSessionCookie(cookieValue: string | null): { email: string } | null {
  if (!cookieValue || !cookieValue.includes(".")) return null;
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.CMS_API_KEY || "stackyup_admin_secret_key_2026";
  const [data, signature] = cookieValue.split(".");
  const expectedSignature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  if (signature !== expectedSignature) return null;

  try {
    const json = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (json.exp && Date.now() > json.exp) return null;
    return json;
  } catch {
    return null;
  }
}

export async function verifyApiKey(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");

  let rawKey: string | null = null;
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      const candidate = parts[1].trim();
      if (candidate && candidate !== "undefined" && candidate !== "null" && candidate !== "") {
        rawKey = candidate;
      }
    }
  }

  // 1. If a valid Bearer API key was provided, verify it (for AI Agents like Muse, Hermes, OpenClaw, curl)
  if (rawKey) {
    // Rate Limiting Check (60 req/min per key identifier)
    const rateLimit = checkRateLimit(rawKey);
    if (!rateLimit.allowed) {
      return {
        authenticated: false,
        statusCode: 429,
        errorCode: "RATE_LIMITED",
        error: "Rate limit exceeded. Maximum 60 requests per minute per API key.",
        details: {
          limit: rateLimit.limit,
          remaining: 0,
          retry_after_seconds: rateLimit.resetSeconds,
        },
        rateLimit,
      };
    }

    // Check against process.env.CMS_API_KEY or NEXT_PUBLIC_CMS_API_KEY
    const envKey = process.env.CMS_API_KEY || process.env.NEXT_PUBLIC_CMS_API_KEY;
    if (envKey && rawKey === envKey) {
      return {
        authenticated: true,
        name: "Environment Master Key",
        rateLimit,
      };
    }

    // Check against database api_keys table
    const keyHash = hashApiKey(rawKey);

    try {
      const matchedKeys = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.keyHash, keyHash))
        .limit(1);

      if (matchedKeys.length > 0) {
        const matchedKey = matchedKeys[0];

        // Check if key is active/revoked
        if (!matchedKey.isActive) {
          return {
            authenticated: false,
            statusCode: 403,
            errorCode: "FORBIDDEN",
            error: "API key has been deactivated or revoked",
            details: { key_prefix: matchedKey.keyPrefix },
            rateLimit,
          };
        }

        // Asynchronously update lastUsedAt
        db.update(schema.apiKeys)
          .set({ lastUsedAt: new Date() })
          .where(eq(schema.apiKeys.id, matchedKey.id))
          .catch((err) => console.error("Failed to update last_used_at for key:", err));

        return {
          authenticated: true,
          name: matchedKey.name,
          keyId: matchedKey.id,
          rateLimit,
        };
      }
    } catch (error) {
      console.error("Auth database verification error:", error);
    }
  }

  // 2. If no valid Bearer key or Bearer key was empty/undefined, check for active Admin Session Cookie
  // This allows the Admin UI (Media Gallery, Post Editor) to perform API operations seamlessly without 401 errors
  const cookieHeader = request.headers.get("cookie");
  const sessionToken = parseCookie(cookieHeader, "sy_admin_session");
  const adminSession = verifyAdminSessionCookie(sessionToken);

  if (adminSession) {
    return {
      authenticated: true,
      name: `Admin Session (${adminSession.email})`,
      keyId: "admin_session",
    };
  }

  // 3. Neither valid Bearer key nor Admin session found -> 401 Unauthorized
  return {
    authenticated: false,
    statusCode: 401,
    errorCode: "UNAUTHORIZED",
    error: "Unauthorized: Missing or invalid API key, or no active admin session.",
  };
}
