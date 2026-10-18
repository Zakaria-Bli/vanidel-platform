import { createHash, randomInt } from 'node:crypto'

/**
 * Recorded on every draw, so an audit knows exactly how its winners were picked. Bump it whenever
 * the pool ordering, the hash input or the selection changes.
 */
export const drawAlgorithmVersion = 'pool-sha256-v1/fisher-yates-crypto-randomInt-v2-one-per-person'

/** Draws `[0, max)`; `crypto.randomInt` in production, a fixed sequence in tests. */
export type RandomIndex = (max: number) => number

/** Participation IDs in the order the pool is hashed and drawn from: ascending. */
export function orderPool(ids: readonly number[]): number[] {
  return [...ids].sort((a, b) => a - b)
}

/**
 * SHA-256 (hex) of the ordered pool, one decimal ID per line. Anyone with the participation IDs
 * can recompute it and prove the pool was unchanged (SPECIFICATION §10.2).
 */
export function hashPool(orderedIds: readonly number[]): string {
  return createHash('sha256').update(orderedIds.join('\n')).digest('hex')
}

/**
 * Picks `count` distinct IDs from the ordered pool with a partial Fisher-Yates shuffle, in the
 * order drawn (rank 1 first). An ID whose `personOf` was already picked is skipped and the shuffle
 * carries on, so nobody wins twice in one draw while each entry stays one chance. Takes one entry
 * per person when the pool holds fewer than `count` people.
 */
export function selectFromPool(
  orderedIds: readonly number[],
  count: number,
  random: RandomIndex = randomInt,
  personOf: (id: number) => number = (id) => id,
): number[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`count must be a positive integer, got ${count}`)
  }
  const pool = [...orderedIds]
  const picks: number[] = []
  const people = new Set<number>()
  for (let i = 0; i < pool.length && picks.length < count; i++) {
    const j = i + random(pool.length - i)
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
    const person = personOf(pool[i])
    if (people.has(person)) continue
    people.add(person)
    picks.push(pool[i])
  }
  return picks
}
