import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "../rate-limit"

describe("auth rate-limit", () => {
  it("allows initial attempts within limit", () => {
    const key = "test-user-1"
    resetRateLimit(key)

    const check = checkRateLimit(key, { maxAttempts: 3, windowMs: 1000 })
    assert.equal(check.allowed, true)
    assert.equal(check.remaining, 3)
  })

  it("blocks requests once maxAttempts is reached", () => {
    const key = "test-user-blocked"
    resetRateLimit(key)

    recordFailedAttempt(key, { maxAttempts: 3, windowMs: 5000 })
    recordFailedAttempt(key, { maxAttempts: 3, windowMs: 5000 })
    recordFailedAttempt(key, { maxAttempts: 3, windowMs: 5000 })

    const check = checkRateLimit(key, { maxAttempts: 3, windowMs: 5000 })
    assert.equal(check.allowed, false)
    assert.equal(check.remaining, 0)
    assert.ok(check.retryAfterMs > 0)
  })

  it("resets limit when resetRateLimit is called", () => {
    const key = "test-user-reset"
    resetRateLimit(key)

    recordFailedAttempt(key, { maxAttempts: 2, windowMs: 5000 })
    recordFailedAttempt(key, { maxAttempts: 2, windowMs: 5000 })

    assert.equal(checkRateLimit(key, { maxAttempts: 2, windowMs: 5000 }).allowed, false)

    resetRateLimit(key)

    assert.equal(checkRateLimit(key, { maxAttempts: 2, windowMs: 5000 }).allowed, true)
  })
})
