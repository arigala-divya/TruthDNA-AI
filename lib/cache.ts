import { Redis } from "@upstash/redis";

/** Optional Upstash Redis cache. All operations no-op gracefully when
 *  UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not configured. */
let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    return (await r.get<T>(key)) ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, value, { ex: ttlSeconds });
  } catch {
    // cache failures must never break an investigation
  }
}

export const TTL = {
  TAVILY_SEARCH: 60 * 60 * 24, // 24 hours
  SOURCE_CREDIBILITY: 60 * 60 * 24 * 7, // 7 days
};
