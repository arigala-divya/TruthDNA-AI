import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./cache";

let limiter: Ratelimit | null | undefined;

/** 10 investigations per hour per IP. Disabled when Upstash isn't configured. */
function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  const redis = getRedis();
  limiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        prefix: "truthdna:ratelimit",
      })
    : null;
  return limiter;
}

export async function checkRateLimit(
  ip: string
): Promise<{ allowed: boolean; remaining?: number; resetAt?: number }> {
  const l = getLimiter();
  if (!l) return { allowed: true };
  try {
    const { success, remaining, reset } = await l.limit(ip);
    return { allowed: success, remaining, resetAt: reset };
  } catch {
    return { allowed: true }; // fail open — rate limiting must not take the app down
  }
}
