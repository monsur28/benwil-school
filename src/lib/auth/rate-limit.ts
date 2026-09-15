import { prisma } from "@/lib/db/client"

interface RateLimitOptions {
  maxAttempts?: number
  windowMs?: number
}

const DEFAULT_MAX_ATTEMPTS = 5
const DEFAULT_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS
  const now = new Date()

  const record = await prisma.rateLimit.findUnique({
    where: { key }
  })

  if (!record) {
    return { allowed: true, remaining: maxAttempts, retryAfterMs: 0 }
  }

  // If the window has expired since the first attempt, reset
  if (now.getTime() - record.firstAttempt.getTime() > windowMs) {
    await prisma.rateLimit.delete({ where: { key } })
    return { allowed: true, remaining: maxAttempts, retryAfterMs: 0 }
  }

  if (record.count >= maxAttempts) {
    const retryAfterMs = Math.max(0, windowMs - (now.getTime() - record.firstAttempt.getTime()))
    return { allowed: false, remaining: 0, retryAfterMs }
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - record.count),
    retryAfterMs: 0,
  }
}

export async function recordFailedAttempt(
  key: string,
  options: RateLimitOptions = {}
): Promise<void> {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS
  const now = new Date()

  const record = await prisma.rateLimit.findUnique({
    where: { key }
  })

  if (!record || now.getTime() - record.firstAttempt.getTime() > windowMs) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, firstAttempt: now, lastAttempt: now },
      update: { count: 1, firstAttempt: now, lastAttempt: now }
    })
  } else {
    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 }, lastAttempt: now }
    })
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  try {
    await prisma.rateLimit.delete({
      where: { key }
    })
  } catch (e) {
    // ignore if doesn't exist
  }
}
