import { NextResponse } from "next/server"
import { assertSameOrigin } from "./csrf"
import { COMMON } from "@/lib/notify/messages"

/**
 * Thin CSRF guard for Route Handlers (API routes).
 *
 * Wraps a Route Handler export and rejects cross-origin state-changing
 * requests with 403 before the handler body runs. Authentication is left to
 * the handler itself (it already calls `auth()` / `getOrganizationId()`).
 *
 * Usage:
 *   export const POST = withApiGuard(async (request: Request) => { ... })
 */
export function withApiGuard<T extends (request: Request, ctx: any) => Promise<Response>>(
  handler: T
): T {
  return (async (request: Request, ctx: any) => {
    if (!(await assertSameOrigin(request.method))) {
      return NextResponse.json({ error: COMMON.FORBIDDEN_ORIGIN }, { status: 403 })
    }
    return handler(request, ctx)
  }) as T
}
