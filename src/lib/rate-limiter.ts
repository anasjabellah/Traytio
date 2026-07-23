import { Ratelimit } from "@upstash/ratelimit";
import { ensureRedis } from "./rate-limit/client";

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetInMs: number;
};

type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

const limiters = new Map<string, Ratelimit>();
let redisAvailable: boolean | null = null;

function getLimiter(config: RateLimitConfig): Ratelimit | null {
  if (redisAvailable === false) return null;

  const key = `${config.maxRequests}:${config.windowMs}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    const redis = ensureRedis();
    if (!redis) {
      redisAvailable = false;
      return null;
    }
    redisAvailable = true;
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs}ms`),
      prefix: "ratelimit:action",
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const limiter = getLimiter(config);
  if (!limiter) {
    return { ok: true, remaining: Infinity, resetInMs: 0 };
  }
  const { success, remaining, reset } = await limiter.limit(key);
  return {
    ok: success,
    remaining,
    resetInMs: Math.max(0, reset - Date.now()),
  };
}

export type { RateLimitResult, RateLimitConfig };
