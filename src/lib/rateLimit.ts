/**
 * In-memory sliding-window rate limiter. Production runs a single Node.js process, so one map
 * covers every request; several processes would each count separately and need a shared store.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>()

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Records an attempt for `key` and says whether it is within the limit. */
  take(key: string, now: number = Date.now()): boolean {
    const since = now - this.windowMs
    const recent = (this.hits.get(key) ?? []).filter((time) => time > since)
    const allowed = recent.length < this.limit
    if (allowed) recent.push(now)
    this.hits.set(key, recent)
    if (this.hits.size > 10_000) this.prune(since)
    return allowed
  }

  private prune(since: number) {
    for (const [key, times] of this.hits) {
      if (times.every((time) => time <= since)) this.hits.delete(key)
    }
  }
}

/** The client address as forwarded by the reverse proxy, which must set X-Forwarded-For. */
export function clientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip')?.trim() ||
    'unknown'
  )
}
