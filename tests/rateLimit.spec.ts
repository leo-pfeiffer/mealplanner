import { describe, it, expect } from 'vitest'
import { assertNotRateLimited, recordAttempt, clearRateLimit } from '../server/utils/rateLimit'

describe('rateLimit', () => {
  it('allows attempts under the limit', () => {
    const key = 'allows-under-limit'
    for (let i = 0; i < 5; i++) {
      expect(() => assertNotRateLimited(key)).not.toThrow()
      recordAttempt(key)
    }
  })

  it('throws 429 once the limit is exceeded', () => {
    const key = 'throws-over-limit'
    for (let i = 0; i < 30; i++) {
      recordAttempt(key)
    }
    expect(() => assertNotRateLimited(key)).toThrow()
  })

  it('resets after clearRateLimit', () => {
    const key = 'resets-after-clear'
    for (let i = 0; i < 30; i++) {
      recordAttempt(key)
    }
    clearRateLimit(key)
    expect(() => assertNotRateLimited(key)).not.toThrow()
  })
})
