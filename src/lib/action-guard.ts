import { auth } from '@clerk/nextjs/server'
import { checkRateLimit } from './rate-limiter'

const MAX_REQUESTS = 10
const WINDOW_MS = 10_000

export function withActionGuard<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: { name: string }
): T {
  return (async (...args: any[]) => {
    const { userId } = await auth()
    const key = userId ? `${userId}:${config.name}` : `anon:${config.name}`

    const result = checkRateLimit(key, { maxRequests: MAX_REQUESTS, windowMs: WINDOW_MS })
    if (!result.ok) {
      return { success: false, error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.' }
    }

    return fn(...args)
  }) as T
}
