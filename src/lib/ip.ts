/** Minimal structural contract satisfied by both `Request.headers` (Route
 * Handlers) and the `Headers` returned by `headers()` from `next/headers`
 * (Server Actions). Deliberately avoids depending on the concrete type so the
 * helper is usable in both runtimes. */
export interface HeaderLookup {
  get(name: string): string | null
}

/**
 * Derive a stable client IP from the incoming request headers. `x-forwarded-for`
 * is set by the hosting proxy (e.g. Vercel) and the first hop is the trusted
 * edge IP; we use it only as an *additional* abuse signal — never as the sole
 * identity, since it is client-controllable. Authenticated callers are keyed
 * primarily by user id (see api-guard.ts / action-guard.ts).
 */
export function getClientIp(headers: HeaderLookup): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}