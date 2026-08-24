import { headers } from "next/headers";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Trusted origin for the application.
 *
 * Derived from the existing env-based configuration (NEXT_PUBLIC_APP_URL),
 * which is the same source used by `layout.tsx` / `page.tsx`. We deliberately
 * do NOT fall back to client-controlled headers such as `Host` or
 * `X-Forwarded-Host`, since those can be spoofed and would let an
 * attacker-controlled value appear trusted. The localhost default mirrors the
 * rest of the app's dev convention when the env var is unset.
 */
function getExpectedOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return fromEnv.replace(/\/$/, "");
}

function getOriginOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Verifies the request originated from the application's own origin.
 *
 * - Safe methods (GET/HEAD/OPTIONS) are always allowed.
 * - For state-changing methods (POST/PUT/PATCH/DELETE):
 *     • A present `Origin` (preferred) or `Referer` header MUST match the app
 *       origin. Comparison uses full-origin parsing, so substring tricks such
 *       as `https://traytio.com.evil.example` are rejected.
 *     • If BOTH `Origin` and `Referer` are absent, the request is REJECTED.
 *       A genuine browser same-origin state-changing request always carries at
 *       least one of them; an absent pair is treated as a non-browser / forged
 *       attempt and must not bypass the guard.
 *
 * `method` is the HTTP method. It defaults to "POST" because Server Actions are
 * always POST and the Server Action context has no request object — pass
 * `request.method` from Route Handlers instead.
 *
 * Uses `headers()` from next/headers so it works in both Server Actions and
 * Route Handlers. Returns `true` when the request is allowed to proceed.
 */
export async function assertSameOrigin(method: string = "POST"): Promise<boolean> {
  if (!STATE_CHANGING_METHODS.has(method.toUpperCase())) {
    return true;
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const referer = headerStore.get("referer");

  // A browser same-origin state-changing request always carries Origin and/or
  // Referer. Missing both means the request is not a legitimate browser
  // same-origin call — reject it instead of implicitly trusting it.
  if (!origin && !referer) {
    return false;
  }

  const expected = getExpectedOrigin();
  // Prefer Origin; only fall back to Referer when Origin is absent/unparseable.
  const incomingOrigin = getOriginOf(origin) ?? getOriginOf(referer);

  // No parseable origin could be derived from the present header(s) → reject.
  if (!incomingOrigin) {
    return false;
  }

  return incomingOrigin === expected;
}
