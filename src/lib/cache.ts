import { getRedis } from "./redis";
import { revalidatePath } from "next/cache";

// In-memory fallback cache when Redis is not yet configured or for fast local hits
interface MemoryCacheEntry {
  value: unknown;
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry>();

function getMemoryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setMemoryCache<T>(key: string, value: T, ttlSeconds: number): void {
  // Cap memory cache size to 500 items to prevent RAM buildup in long-running nodes
  if (memoryCache.size > 500) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function deleteMemoryCache(keyOrPrefix: string): void {
  for (const k of Array.from(memoryCache.keys())) {
    if (k === keyOrPrefix || k.startsWith(keyOrPrefix)) {
      memoryCache.delete(k);
    }
  }
}

/**
 * Universal caching function:
 * 1. Checks Upstash Redis if configured
 * 2. Falls back to in-memory cache
 * 3. Calls fetcher() on miss and saves to both layers with TTL
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const redis = getRedis();

  // 1. Try Upstash Redis
  if (redis) {
    try {
      const cached = await redis.get<T>(key);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    } catch (err) {
      console.warn(`[Cache] Redis GET failed for key "${key}", falling back:`, err);
    }
  }

  // 2. Try In-Memory Fallback
  const memCached = getMemoryCache<T>(key);
  if (memCached !== null) {
    return memCached;
  }

  // 3. Fetch from source
  const freshData = await fetcher();

  // 4. Save to Redis
  if (redis && freshData !== undefined && freshData !== null) {
    try {
      await redis.set(key, freshData, { ex: ttlSeconds });
    } catch (err) {
      console.warn(`[Cache] Redis SET failed for key "${key}":`, err);
    }
  }

  // 5. Save to In-Memory Fallback
  if (freshData !== undefined && freshData !== null) {
    setMemoryCache(key, freshData, ttlSeconds);
  }

  return freshData;
}

/**
 * Invalidate a specific cache key
 */
export async function invalidateCacheKey(key: string): Promise<void> {
  deleteMemoryCache(key);

  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(key);
    } catch (err) {
      console.warn(`[Cache] Redis DEL failed for key "${key}":`, err);
    }
  }
}

/**
 * Invalidate all post-related caches and revalidate Next.js static paths
 */
export async function invalidatePostCache(slug?: string): Promise<void> {
  const redis = getRedis();

  const keysToDelete = [
    "posts:published:latest",
    "posts:popular",
    "sitemap:data",
    "rss:data",
  ];

  if (slug) {
    keysToDelete.push(`posts:slug:${slug}`);
  }

  // 1. Invalidate memory cache
  for (const k of keysToDelete) {
    deleteMemoryCache(k);
  }
  deleteMemoryCache("posts:");

  // 2. Invalidate Upstash Redis
  if (redis) {
    try {
      for (const k of keysToDelete) {
        await redis.del(k);
      }
    } catch (err) {
      console.warn("[Cache] Redis DEL failed during post invalidation:", err);
    }
  }

  // 3. Revalidate Next.js Edge paths
  try {
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");
    if (slug) {
      revalidatePath(`/${slug}`);
    }
  } catch {
    // revalidatePath might be called outside request context (e.g. CLI), ignore safely
  }
}

/**
 * Clear all in-memory and Redis caches
 */
export async function clearCache(): Promise<void> {
  memoryCache.clear();
  const redis = getRedis();
  if (redis) {
    try {
      await redis.flushdb();
    } catch (err) {
      console.warn("[Cache] Redis flushdb failed:", err);
    }
  }
}

