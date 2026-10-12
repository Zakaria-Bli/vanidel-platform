import { describe, expect, it } from 'vitest'

import { clientIp, RateLimiter } from './rateLimit'

describe('RateLimiter', () => {
  it('allows up to the limit within the window, per key', () => {
    const limiter = new RateLimiter(2, 1000)

    expect(limiter.take('a', 0)).toBe(true)
    expect(limiter.take('a', 10)).toBe(true)
    expect(limiter.take('a', 20)).toBe(false)
    expect(limiter.take('b', 20)).toBe(true)
  })

  it('frees attempts as they leave the window', () => {
    const limiter = new RateLimiter(1, 1000)

    expect(limiter.take('a', 0)).toBe(true)
    expect(limiter.take('a', 999)).toBe(false)
    expect(limiter.take('a', 1001)).toBe(true)
  })
})

describe('clientIp', () => {
  it('takes the first forwarded address', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '41.98.1.2, 10.0.0.1' }))).toBe('41.98.1.2')
  })

  it('falls back to X-Real-IP, then to a shared bucket', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '41.98.1.3' }))).toBe('41.98.1.3')
    expect(clientIp(new Headers())).toBe('unknown')
  })
})
