import { describe, expect, it } from 'vitest'

import { contestCountdown } from './countdown'
import type { ContestSchedule } from './phase'

// Algiers is UTC+1 all year: 23:00 UTC is midnight there.
const contest: ContestSchedule = {
  status: 'published',
  startAt: '2026-10-15T08:00:00.000Z',
  endAt: '2026-11-12T23:00:00.000Z',
}

describe('contestCountdown', () => {
  it('counts Algiers days to the last day of an open contest', () => {
    expect(contestCountdown(contest, new Date('2026-11-07T10:00:00.000Z'))).toEqual({
      kind: 'ends',
      days: 5,
    })
    expect(contestCountdown(contest, new Date('2026-11-11T22:59:00.000Z'))).toEqual({
      kind: 'ends',
      days: 1,
    })
  })

  it('says today on the last day, whatever the hour in UTC', () => {
    // 00:30 in Algiers on 12 November, still the 11th in UTC.
    expect(contestCountdown(contest, new Date('2026-11-11T23:30:00.000Z'))).toEqual({
      kind: 'ends',
      days: 0,
    })
  })

  it('counts days until an upcoming contest opens', () => {
    expect(contestCountdown(contest, new Date('2026-10-12T12:00:00.000Z'))).toEqual({
      kind: 'starts',
      days: 3,
    })
    expect(contestCountdown(contest, new Date('2026-10-15T07:00:00.000Z'))).toEqual({
      kind: 'starts',
      days: 0,
    })
  })

  it('has nothing to count once a contest has ended or is not published', () => {
    expect(contestCountdown(contest, new Date('2026-11-12T23:00:00.000Z'))).toBeNull()
    expect(
      contestCountdown({ ...contest, status: 'draft' }, new Date('2026-10-20T00:00:00.000Z')),
    ).toBeNull()
  })
})
