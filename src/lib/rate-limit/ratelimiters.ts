import { Ratelimit } from "@upstash/ratelimit";
import { ensureRedis } from "./client";

export function createAuthLimiter(): Ratelimit | null {
  const redis = ensureRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "ratelimit:auth",
  });
}

export function createApiLimiter(): Ratelimit | null {
  const redis = ensureRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "ratelimit:api",
  });
}

export function createGlobalLimiter(): Ratelimit | null {
  const redis = ensureRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, "1 m"),
    prefix: "ratelimit:global",
  });
}
