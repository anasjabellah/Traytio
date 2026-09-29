import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { checkRateLimit } from './rate-limiter'
import { getClientIp } from './ip'
import { assertSameOrigin } from './csrf'
import { AUTH } from '@/lib/notify/messages'
import { COMMON } from '@/lib/notify/messages'
import { BILLING } from '@/lib/notify/messages'
import {
  requireActiveSubscription,
  SubscriptionRequiredError,
} from '@/features/billing/lib/billing'

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
  public?: boolean;
  /**
   * Opt-out for the subscription-entitlement gate.
   * Authenticated, non-public actions REQUIRE an active subscription by
   * default (P0 SaaS enforcement). Set `requireSubscription: false` ONLY for
   * actions that must remain reachable without one — the billing purchase /
   * management path (billing:*) and flows that predate any subscription.
   * Reads are enforced like writes: entitlement is about the organization,
   * not the operation kind.
   */
  requireSubscription?: boolean }
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

    const key = userId
      ? `${userId}:${config.name}`
      : `anon:${getClientIp(await headers())}:${config.name}`

    const result = await checkRateLimit(key, "action")
    if (!result.ok) {
      return { success: false, error: COMMON.RATE_LIMITED }
    }

    // Third security gate: subscription entitlement. Authenticated callers
    // acting for an organization must belong to an entitled one, unless the
    // action explicitly opts out (billing purchase/management, pre-login and
    // pre-subscription flows). Never uses client-supplied organization data.
    if (userId && !config.public && config.requireSubscription !== false) {
      try {
        await requireActiveSubscription()
      } catch (err: unknown) {
        if (err instanceof SubscriptionRequiredError) {
          return { success: false, error: BILLING.SUBSCRIPTION_REQUIRED }
        }
        throw err
      }
    }

    return fn(...args)
  }) as T
}
