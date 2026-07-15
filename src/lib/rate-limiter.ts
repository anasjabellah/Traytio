type RateLimitResult = {
  ok: boolean
  remaining: number
  resetInMs: number
}

type RateLimitConfig = {
  maxRequests: number
  windowMs: number
}

class InMemoryRateLimiter {
  private store = new Map<string, number[]>()
  private cleanupTimer: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanup(), 60_000)
    if (this.cleanupTimer && typeof this.cleanupTimer === 'object' && 'unref' in this.cleanupTimer) {
      this.cleanupTimer.unref()
    }
  }

  check(key: string, { maxRequests, windowMs }: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const timestamps = this.store.get(key) ?? []
    const valid = timestamps.filter(t => now - t < windowMs)

    if (valid.length >= maxRequests) {
      this.store.set(key, valid)
      return { ok: false, remaining: 0, resetInMs: windowMs - (now - valid[0]) }
    }

    valid.push(now)
    this.store.set(key, valid)
    return { ok: true, remaining: maxRequests - valid.length, resetInMs: 0 }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, timestamps] of this.store.entries()) {
      const valid = timestamps.filter(t => now - t < 60_000)
      if (valid.length === 0) {
        this.store.delete(key)
      } else {
        this.store.set(key, valid)
      }
    }
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}

const limiter = new InMemoryRateLimiter()

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  return limiter.check(key, config)
}

export type { RateLimitResult, RateLimitConfig }
