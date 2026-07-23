import { Ratelimit } from "@upstash/ratelimit";
import { identify } from "./identify";
import { createAuthLimiter, createApiLimiter, createGlobalLimiter } from "./ratelimiters";
import type { RateLimitResult } from "./helpers";
export { buildRateLimitHeaders, rateLimitResponse } from "./helpers";
export type { RateLimitResult } from "./helpers";

let authLimiter: Ratelimit | null | undefined = undefined;
let apiLimiter: Ratelimit | null | undefined = undefined;
let globalLimiter: Ratelimit | null | undefined = undefined;

const PASS: RateLimitResult = {
  success: true,
  limit: Infinity,
  remaining: Infinity,
  reset: 0,
};

export async function authRateLimit(request: Request): Promise<RateLimitResult> {
  if (authLimiter === undefined) authLimiter = createAuthLimiter();
  if (!authLimiter) return PASS;
  const id = await identify(request);
  return authLimiter.limit(id);
}

export async function apiRateLimit(request: Request): Promise<RateLimitResult> {
  if (apiLimiter === undefined) apiLimiter = createApiLimiter();
  if (!apiLimiter) return PASS;
  const id = await identify(request);
  return apiLimiter.limit(id);
}

export async function globalRateLimit(request: Request): Promise<RateLimitResult> {
  if (globalLimiter === undefined) globalLimiter = createGlobalLimiter();
  if (!globalLimiter) return PASS;
  const id = await identify(request);
  return globalLimiter.limit(id);
}
