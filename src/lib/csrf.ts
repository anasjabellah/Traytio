import { headers } from "next/headers";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getExpectedOrigin(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return null;
}

/**
 * Verifies the request originated from the application's own origin.
 *
 * - Safe methods (GET/HEAD/OPTIONS) are always allowed.
 * - For state-changing methods (POST/PUT/PATCH/DELETE): if an `Origin` (or
 *   `Referer`) header is present, it MUST match the app origin. A missing
 *   header on a state-changing request is permitted (some same-origin clients
 *   and navigations omit it), so we only reject on a *mismatch*.
 *
 * `method` should be the HTTP method. It defaults to "POST" because Server
 * Actions are always POST requests and the Server Action context has no
 * request object — pass `request.method` from Route Handlers instead.
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

  const incoming = origin ?? referer;
  if (!incoming) {
    return true;
  }

  let incomingOrigin: string;
  try {
    incomingOrigin = new URL(incoming).origin;
  } catch {
    return false;
  }

  const expected = getExpectedOrigin();
  if (expected) {
    return incomingOrigin === expected;
  }

  const host = headerStore.get("host");
  if (!host) return false;
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  return incomingOrigin === `${proto}://${host}`;
}
