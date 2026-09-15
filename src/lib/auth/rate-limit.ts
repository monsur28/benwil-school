type RateLimitRecord = {
  count: number
  firstAttempt: number
  lastAttempt: number
}

// Global in-memory map to survive across server action calls in the Node process
const globalAttempts = new Map<string, RateLimitRecord>()

interface RateLimitOptions {
  maxAttempts?: number
  windowMs?: number
}

const DEFAULT_MAX_ATTEMPTS = 5
const DEFAULT_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS
  const now = Date.now()

  // Clean up any stale keys periodically (opportunistic cleanup)
  if (globalAttempts.size > 1000) {
    for (const [k, record] of globalAttempts.entries()) {
      if (now - record.lastAttempt > windowMs) {
        globalAttempts.delete(k)
      }
    }
  }

  const record = globalAttempts.get(key)
  if (!record) {
    return { allowed: true, remaining: maxAttempts, retryAfterMs: 0 }
  }

  // If the window has expired since the first attempt, reset
  if (now - record.firstAttempt > windowMs) {
    globalAttempts.delete(key)
    return { allowed: true, remaining: maxAttempts, retryAfterMs: 0 }
  }

  if (record.count >= maxAttempts) {
    const retryAfterMs = Math.max(0, windowMs - (now - record.firstAttempt))
    return { allowed: false, remaining: 0, retryAfterMs }
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - record.count),
    retryAfterMs: 0,
  }
}

export function recordFailedAttempt(
  key: string,
  options: RateLimitOptions = {}
): void {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS
  const now = Date.now()

  const record = globalAttempts.get(key)
  if (!record || now - record.firstAttempt > windowMs) {
    globalAttempts.set(key, { count: 1, firstAttempt: now, lastAttempt: now })
  } else {
    record.count += 1
    record.lastAttempt = now
  }
}

export function resetRateLimit(key: string): void {
  globalAttempts.delete(key)
}
