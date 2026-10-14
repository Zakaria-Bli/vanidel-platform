import { describe, expect, it } from 'vitest'

import { winnersByPeriod, type PublicWinner } from './publicWinners'

const winner = (id: number, periodStart: string, rank = 1): PublicWinner => ({
  id,
  contestId: 1,
  name: `Winner ${id}`,
  rank,
  periodStart,
  periodEnd: new Date(Date.parse(periodStart) + 7 * 86_400_000).toISOString(),
  media: null,
})

describe('winnersByPeriod', () => {
  it('lists the latest period first', () => {
    const groups = winnersByPeriod([
      winner(1, '2026-10-14T23:00:00.000Z'),
      winner(2, '2026-10-21T23:00:00.000Z'),
    ])
    expect(groups.map(({ winners }) => winners.map(({ id }) => id))).toEqual([[2], [1]])
  })

  it('keeps a re-draw replacement with the period it completes, by rank', () => {
    const groups = winnersByPeriod([
      winner(5, '2026-10-14T23:00:00.000Z', 1),
      winner(3, '2026-10-14T23:00:00.000Z', 2),
      winner(4, '2026-10-14T23:00:00.000Z', 1),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].winners.map(({ id }) => id)).toEqual([4, 5, 3])
  })

  it('treats equal instants written differently as one period', () => {
    const groups = winnersByPeriod([
      winner(1, '2026-10-14T23:00:00.000Z'),
      winner(2, '2026-10-14T23:00:00Z'),
    ])
    expect(groups).toHaveLength(1)
  })

  it('returns nothing without winners', () => {
    expect(winnersByPeriod([])).toEqual([])
  })
})
