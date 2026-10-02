import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;
let isInitialized = false;

/**
 * Returns an active Upstash Redis client instance, or null if credentials are not configured.
 * Compatible with both direct Upstash Redis and Vercel KV environment variables.
 */
export function getRedis(): Redis | null {
  if (isInitialized) return redisInstance;

  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.REDIS_URL;

  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.REDIS_TOKEN;

  if (url && token && url.trim() !== "" && token.trim() !== "") {
    try {
      redisInstance = new Redis({
        url: url.trim(),
        token: token.trim(),
      });
      isInitialized = true;
      return redisInstance;
    } catch (error) {
      console.warn("[Redis] Failed to initialize Upstash Redis:", error);
      redisInstance = null;
      isInitialized = true;
      return null;
    }
  }

  isInitialized = true;
  return null;
}

export async function isRedisAvailable(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    const pong = await redis.ping();
    return pong === "PONG" || pong === "OK";
  } catch {
    return false;
  }
}
