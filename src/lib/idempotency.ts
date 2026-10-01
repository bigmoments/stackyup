import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export interface CachedIdempotency {
  isCached: boolean;
  status?: number;
  body?: unknown;
}

export async function checkIdempotency(key: string | null): Promise<CachedIdempotency> {
  if (!key) return { isCached: false };

  try {
    const records = await db
      .select()
      .from(schema.idempotencyKeys)
      .where(eq(schema.idempotencyKeys.key, key))
      .limit(1);

    if (records.length > 0) {
      const record = records[0];
      let body: unknown;
      try {
        body = JSON.parse(record.responseBody);
      } catch {
        body = record.responseBody;
      }
      return {
        isCached: true,
        status: record.responseStatus,
        body,
      };
    }
  } catch (err) {
    console.error("Idempotency check error:", err);
  }

  return { isCached: false };
}

export async function saveIdempotency(key: string | null, status: number, body: unknown): Promise<void> {
  if (!key) return;

  try {
    const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
    await db.insert(schema.idempotencyKeys).values({
      key,
      responseStatus: status,
      responseBody: bodyStr,
    });
  } catch (err) {
    console.error("Failed to save idempotency key:", err);
  }
}
