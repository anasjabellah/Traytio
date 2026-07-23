import { NextResponse } from "next/server";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export function buildRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  const retryAfter = Math.ceil(Math.max(0, result.reset - Date.now()) / 1000);
  headers.set("Retry-After", String(retryAfter));
  headers.set("X-RateLimit-Limit", String(result.limit));
  headers.set("X-RateLimit-Remaining", String(result.remaining));
  return headers;
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: "Trop de requêtes. Veuillez réessayer dans quelques instants." },
    {
      status: 429,
      headers: buildRateLimitHeaders(result),
    }
  );
}


