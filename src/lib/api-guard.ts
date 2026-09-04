import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { assertSameOrigin } from "./csrf";
import { checkRateLimit, type RateLimitCategory, type RateLimitResult } from "./rate-limiter";
import { COMMON } from "@/lib/notify/messages";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Derive a stable client IP. `x-forwarded-for` is set by the hosting proxy
 * (e.g. Vercel) and the first hop is the trusted edge IP; we use it only as an
 * *additional* abuse signal — never as the sole identity, since it is
 * client-controllable. Authenticated routes are keyed primarily by user id.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function buildRateLimitKey(request: Request, userId: string | null, category: RateLimitCategory): string {
  const ip = getClientIp(request);
  const identity = userId ? `user:${userId}` : `anon:${ip}`;
  return `${category}:${identity}:${ip}`;
}

export function rateLimitHeaders(remaining: number, resetInMs: number): Headers {
  const headers = new Headers();
  headers.set("Retry-After", String(Math.ceil(resetInMs / 1000)));
  headers.set("X-RateLimit-Remaining", String(remaining));
  return headers;
}

/**
 * Build the standard response for a rate-limit rejection, matching the format
 * used by `withApiGuard`. Shared so GET-limited routes (e.g. PDF generation)
 * return the same body + headers as every other limited endpoint.
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: COMMON.RATE_LIMITED },
    { status: 429, headers: rateLimitHeaders(result.remaining, result.resetInMs) },
  );
}

/**
 * Build the standard fail-closed response when the rate-limit backing store
 * (Redis) is unavailable in production, matching `withApiGuard`.
 */
export function rateLimitUnavailableResponse(): NextResponse {
  return NextResponse.json({ error: COMMON.RATE_LIMIT_UNAVAILABLE }, { status: 503 });
}

/**
 * Guard for Route Handlers (API routes).
 *
 * Enforces, in order:
 *   1. CSRF (same-origin) for all requests
 *   2. Rate limiting for state-changing writes (POST/PUT/PATCH/DELETE)
 *
 * Authentication and RBAC are enforced by the wrapped handler itself
 * (it calls `auth()` / `getOrganizationId()` / `assertCan`). This guard is the
 * single point of enforcement for API-layer rate limiting — do not add a
 * second limiter inside individual route handlers.
 *
 * Usage:
 *   export const POST = withApiGuard(async (request: Request) => { ... })
 */
export function withApiGuard<T extends (request: Request, ctx: any) => Promise<Response>>(
  handler: T
): T {
  return (async (request: Request, ctx: any) => {
    if (!(await assertSameOrigin(request.method))) {
      return NextResponse.json({ error: COMMON.FORBIDDEN_ORIGIN }, { status: 403 });
    }

    const method = request.method.toUpperCase();
    if (WRITE_METHODS.has(method)) {
      const { userId } = await auth();
      const pathname = new URL(request.url).pathname;
      const category: RateLimitCategory = pathname.includes("/upload") ? "upload" : "write";
      const key = buildRateLimitKey(request, userId, category);

      const result = await checkRateLimit(key, category);
      if (!result.ok) {
        if (result.reason === "unavailable") {
          // Redis configured but unreachable → fail closed (no silent bypass).
          return NextResponse.json(
            { error: COMMON.RATE_LIMIT_UNAVAILABLE },
            { status: 503 },
          );
        }
        return NextResponse.json(
          { error: COMMON.RATE_LIMITED },
          { status: 429, headers: rateLimitHeaders(result.remaining, result.resetInMs) },
        );
      }
    }

    return handler(request, ctx);
  }) as T;
}
