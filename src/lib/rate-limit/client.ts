import { Redis } from "@upstash/redis";

let client: Redis | null = null;
let warned = false;

function ensureRedis(): Redis | null {
  if (client) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!warned) {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Rate limiting disabled."
      );
      warned = true;
    }
    return null;
  }

  client = new Redis({ url, token });
  return client;
}

export { ensureRedis };
