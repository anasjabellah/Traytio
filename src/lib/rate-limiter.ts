import { Ratelimit } from "@upstash/ratelimit";
import { ensureRedis } from "./rate-limit/client";

export type RateLimitCategory = "action" | "write" | "upload";

/**
 * Centralized rate-limit policy (requests per sliding window).
 *
 * - action: server actions (read/write), strict because they run during render
 * - write:  normal authenticated CRUD API writes
 * - upload: resource-heavy Cloudinary uploads, stricter than CRUD
 *
 * Limits are intentionally centralized here — do not hardcode per-route limits.
 */
const CATEGORY_CONFIG: Record<RateLimitCategory, { max: number; window: `${number} s` | `${number} m` }> = {
  action: { max: 10, window: "10 s" },
  write: { max: 60, window: "1 m" },
  upload: { max: 10, window: "1 m" },
};

export type RateLimitReason = "ok" | "limit" | "unavailable" | "disabled";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetInMs: number;
  /**
   * - "ok"         request allowed
   * - "limit"      rate limit exceeded
   * - "unavailable" Redis configured but unreachable at runtime → FAIL CLOSED
   * - "disabled"   Redis env not configured (dev/local) → limiting skipped
   */
  reason: RateLimitReason;
};

const limiters = new Map<RateLimitCategory, Ratelimit>();

function getLimiter(category: RateLimitCategory): Ratelimit | null {
  let limiter = limiters.get(category);
  if (!limiter) {
    const redis = ensureRedis();
    if (!redis) return null; // env not configured
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        CATEGORY_CONFIG[category].max,
        CATEGORY_CONFIG[category].window,
      ),
      prefix: `ratelimit:${category}`,
    });
    limiters.set(category, limiter);
  }
  return limiter;
}

export async function checkRateLimit(
  key: string,
  category: RateLimitCategory,
): Promise<RateLimitResult> {
  const limiter = getLimiter(category);
  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      // Production misconfiguration: Redis env vars are missing. We must NOT
      // silently allow unlimited writes, so fail closed (same path as a
      // runtime Redis outage → rejected writes / HTTP 503 in `withApiGuard`).
      return { ok: false, remaining: 0, resetInMs: 0, reason: "unavailable" };
    }
    // Dev/local without Redis: limiting disabled (not bypassed in production).
    return { ok: true, remaining: Infinity, resetInMs: 0, reason: "disabled" };
  }

  try {
    const { success, remaining, reset } = await limiter.limit(key);
    return {
      ok: success,
      remaining,
      resetInMs: Math.max(0, reset - Date.now()),
      reason: success ? "ok" : "limit",
    };
  } catch {
    // Redis is configured but unreachable → fail CLOSED (no silent unlimited).
    return { ok: false, remaining: 0, resetInMs: 0, reason: "unavailable" };
  }
}
