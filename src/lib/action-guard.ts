import { auth } from '@clerk/nextjs/server'
import { checkRateLimit } from './rate-limiter'
import { assertSameOrigin } from './csrf'
import { AUTH } from '@/lib/notify/messages'
import { COMMON } from '@/lib/notify/messages'

// Read/view actions are not state-changing and are invoked during page
// rendering (Server Action reads carry an Origin header that varies by
// deployment/preview/port). Applying a same-origin CSRF check to them rejects
// legitimate same-origin reads, so the origin gate is enforced only on writes.
function isWriteAction(name: string): boolean {
  const action = name.split(':')[1] ?? ''
  return action !== 'read' && action !== 'view'
}

export function withActionGuard<T extends (...args: any[]) => Promise<unknown>>(
  fn: T,
  config: { name: string; /**
   * Opt-out for the authentication gate.
   * SECURITY: authentication is REQUIRED by default. Only actions that must be
   * reachable before login (e.g. the invitation lookup / accept-invite flow)
   * should set `public: true`. Treat this as an exception, never the default.
   */
  public?: boolean }
): T {
  return (async (...args: Parameters<T>) => {
    const { userId } = await auth()

    // First security gate: block anonymous callers unless explicitly public.
    if (!userId && !config.public) {
      return { success: false, error: AUTH.SESSION.UNAUTHORIZED }
    }

    // Second security gate: CSRF — reject cross-origin state-changing requests.
    // Only enforced on writes; reads/views are safe and may render from
    // deployments whose Origin differs from NEXT_PUBLIC_APP_URL.
    if (isWriteAction(config.name) && !(await assertSameOrigin())) {
      return { success: false, error: COMMON.FORBIDDEN_ORIGIN }
    }

    const key = userId ? `${userId}:${config.name}` : `anon:${config.name}`

    const result = await checkRateLimit(key, "action")
    if (!result.ok) {
      return { success: false, error: COMMON.RATE_LIMITED }
    }

    return fn(...args)
  }) as T
}
