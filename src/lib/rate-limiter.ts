/**
 * In-memory sliding window rate limiter
 * Spec: 60 requests per minute per API key (or client IP)
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

// Cleanup old keys periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < WINDOW_MS);
      if (record.timestamps.length === 0) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  let record = rateLimitMap.get(identifier);

  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(identifier, record);
  }

  // Filter out timestamps older than the 1-minute window
  record.timestamps = record.timestamps.filter((ts) => now - ts < WINDOW_MS);

  if (record.timestamps.length >= MAX_REQUESTS) {
    const oldestTimestamp = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldestTimestamp + WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      limit: MAX_REQUESTS,
      remaining: 0,
      resetSeconds,
    };
  }

  // Record this request
  record.timestamps.push(now);
  const remaining = MAX_REQUESTS - record.timestamps.length;
  const resetSeconds = Math.max(1, Math.ceil((record.timestamps[0] + WINDOW_MS - now) / 1000));

  return {
    allowed: true,
    limit: MAX_REQUESTS,
    remaining,
    resetSeconds,
  };
}
