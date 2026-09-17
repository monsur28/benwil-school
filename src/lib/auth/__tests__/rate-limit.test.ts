import "dotenv/config"
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "../rate-limit"

describe("auth rate-limit", () => {
  it("allows initial attempts within limit", async () => {
    const key = "test-user-1"
    await resetRateLimit(key)

    const check = await checkRateLimit(key, { maxAttempts: 3, windowMs: 1000 })
    assert.equal(check.allowed, true)
    assert.equal(check.remaining, 3)
  })

  it("blocks requests once maxAttempts is reached", async () => {
    const key = "test-user-blocked"
    await resetRateLimit(key)

    await recordFailedAttempt(key, { maxAttempts: 3, windowMs: 5000 })
    await recordFailedAttempt(key, { maxAttempts: 3, windowMs: 5000 })
    await recordFailedAttempt(key, { maxAttempts: 3, windowMs: 5000 })

    const check = await checkRateLimit(key, { maxAttempts: 3, windowMs: 5000 })
    assert.equal(check.allowed, false)
    assert.equal(check.remaining, 0)
    assert.ok(check.retryAfterMs > 0)
  })

  it("resets limit when resetRateLimit is called", async () => {
    const key = "test-user-reset"
    await resetRateLimit(key)

    await recordFailedAttempt(key, { maxAttempts: 2, windowMs: 5000 })
    await recordFailedAttempt(key, { maxAttempts: 2, windowMs: 5000 })

    assert.equal((await checkRateLimit(key, { maxAttempts: 2, windowMs: 5000 })).allowed, false)

    await resetRateLimit(key)

    assert.equal((await checkRateLimit(key, { maxAttempts: 2, windowMs: 5000 })).allowed, true)
  })
})
