import { Redis } from "@upstash/redis";

let client: Redis | null = null;
let warned = false;

function ensureRedis(): Redis | null {
  if (client) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      // Never silent in production: misconfiguration must be loud and the
      // limiter fails closed (see checkRateLimit's "unavailable" branch).
      console.error(
        "[rate-limit] FATAL: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set in production. " +
          "Rate limiting is DISABLED and requests are REJECTED (fail-closed) to prevent unlimited writes."
      );
    } else if (!warned) {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Rate limiting disabled (dev/local)."
      );
      warned = true;
    }
    return null;
  }

  client = new Redis({ url, token });
  return client;
}

export { ensureRedis };
