import { auth } from '@clerk/nextjs/server'
import { checkRateLimit } from './rate-limiter'
import { assertSameOrigin } from './csrf'
import { AUTH } from '@/lib/notify/messages'
import { COMMON } from '@/lib/notify/messages'

const MAX_REQUESTS = 10
const WINDOW_MS = 10_000

export function withActionGuard<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: { name: string; /**
   * Opt-out for the authentication gate.
   * SECURITY: authentication is REQUIRED by default. Only actions that must be
   * reachable before login (e.g. the invitation lookup / accept-invite flow)
   * should set `public: true`. Treat this as an exception, never the default.
   */
  public?: boolean }
): T {
  return (async (...args: any[]) => {
    const { userId } = await auth()

    // First security gate: block anonymous callers unless explicitly public.
    if (!userId && !config.public) {
      return { success: false, error: AUTH.SESSION.UNAUTHORIZED }
    }

    // Second security gate: CSRF — reject cross-origin state-changing requests.
    // Server Actions are always POST; assertSameOrigin defaults to "POST".
    // Applies to both authenticated and explicitly public actions.
    if (!(await assertSameOrigin())) {
      return { success: false, error: COMMON.FORBIDDEN_ORIGIN }
    }

    const key = userId ? `${userId}:${config.name}` : `anon:${config.name}`

    const result = checkRateLimit(key, { maxRequests: MAX_REQUESTS, windowMs: WINDOW_MS })
    if (!result.ok) {
      return { success: false, error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.' }
    }

    return fn(...args)
  }) as T
}
