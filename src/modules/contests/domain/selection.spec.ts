import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { hashPool, orderPool, selectFromPool } from './selection'

/** A fake generator returning the given values in turn. */
const sequence = (...values: number[]) => {
  const calls: number[] = []
  const random = (max: number) => {
    calls.push(max)
    return values[calls.length - 1]
  }
  return Object.assign(random, { calls })
}

describe('orderPool and hashPool', () => {
  it('hashes the IDs in ascending order, one per line', () => {
    const ordered = orderPool([30, 4, 12])

    expect(ordered).toEqual([4, 12, 30])
    expect(hashPool(ordered)).toBe(createHash('sha256').update('4\n12\n30').digest('hex'))
  })

  it('gives a different hash when any entry changes', () => {
    expect(hashPool([1, 2, 3])).not.toBe(hashPool([1, 2, 4]))
  })
})

describe('selectFromPool', () => {
  it('swaps each pick into place from the remaining pool', () => {
    const random = sequence(2, 0)

    // [10, 20, 30, 40]: pick index 2 (30), then index 1 + 0 of what is left (20).
    expect(selectFromPool([10, 20, 30, 40], 2, random)).toEqual([30, 20])
    expect(random.calls).toEqual([4, 3])
  })

  it('takes the whole pool when it is smaller than the count', () => {
    expect(selectFromPool([7, 8], 5, sequence(1, 0)).sort()).toEqual([7, 8])
    expect(selectFromPool([], 1)).toEqual([])
  })

  it('never picks the same entry twice', () => {
    const pool = Array.from({ length: 50 }, (_, i) => i + 1)
    const picks = selectFromPool(pool, 50)

    expect(new Set(picks).size).toBe(50)
  })

  it('refuses a count below one', () => {
    expect(() => selectFromPool([1], 0)).toThrow(RangeError)
  })
})
