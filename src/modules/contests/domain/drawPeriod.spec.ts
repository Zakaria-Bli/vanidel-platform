import { describe, expect, it } from 'vitest'

import {
  drawPeriodFor,
  drawPeriodsOf,
  endOfAlgiersDayOf,
  startOfAlgiersDay,
  startOfAlgiersDayOf,
  type DrawSettings,
} from './drawPeriod'

// Algiers is UTC+1 all year, so 00:00 Algiers is 23:00 UTC the day before.
// 2026-10-15 is a Thursday.
const contest = {
  startAt: '2026-10-15T09:00:00.000Z', // Thursday 10:00 Algiers
  endAt: '2026-11-15T23:00:00.000Z', // Monday 16 Nov 00:00 Algiers
  draw: { periodDays: 7, periodStartDay: 'sunday' } as DrawSettings, // weekly, starting Sundays
}

const period = (iso: string, settings = contest) => drawPeriodFor(settings, new Date(iso))
const iso = (date: Date | undefined) => date?.toISOString()

describe('drawPeriodFor', () => {
  it('clips the first period to the contest start', () => {
    const first = period('2026-10-16T12:00:00.000Z')

    expect(first?.index).toBe(0)
    expect(iso(first?.start)).toBe('2026-10-15T09:00:00.000Z')
    expect(iso(first?.end)).toBe('2026-10-17T23:00:00.000Z') // Sunday 18 Oct 00:00 Algiers
  })

  it('starts a new period at Algiers midnight, not UTC midnight', () => {
    // Saturday 23:30 UTC is already Sunday 00:30 in Algiers.
    const sunday = period('2026-10-17T23:30:00.000Z')
    expect(sunday?.index).toBe(1)
    expect(iso(sunday?.start)).toBe('2026-10-17T23:00:00.000Z')
    expect(iso(sunday?.end)).toBe('2026-10-24T23:00:00.000Z')

    // Saturday 22:59 UTC is still Saturday 23:59 in Algiers.
    expect(period('2026-10-17T22:59:59.999Z')?.index).toBe(0)
  })

  it('treats the period end as exclusive', () => {
    expect(period('2026-10-24T23:00:00.000Z')?.index).toBe(2)
  })

  it('clips the last period to the contest end', () => {
    const last = period('2026-11-15T22:00:00.000Z')

    expect(last?.index).toBe(5)
    expect(iso(last?.start)).toBe('2026-11-14T23:00:00.000Z')
    expect(iso(last?.end)).toBe('2026-11-15T23:00:00.000Z')
  })

  it('returns null outside the contest', () => {
    expect(period('2026-10-15T08:59:59.999Z')).toBeNull()
    expect(period('2026-11-15T23:00:00.000Z')).toBeNull()
  })

  it('anchors on the start weekday by default', () => {
    const thursdays = { ...contest, draw: { periodDays: 7 } }

    const first = period('2026-10-21T12:00:00.000Z', thursdays)
    expect(first?.index).toBe(0)
    expect(iso(first?.end)).toBe('2026-10-21T23:00:00.000Z') // Thursday 22 Oct 00:00 Algiers

    expect(period('2026-10-21T23:00:00.000Z', thursdays)?.index).toBe(1)
  })

  it('supports periods other than a week', () => {
    const daily = { ...contest, draw: { periodDays: 1, periodStartDay: 'sunday' as const } }

    const second = period('2026-10-16T12:00:00.000Z', daily)
    expect(second?.index).toBe(1)
    expect(iso(second?.start)).toBe('2026-10-15T23:00:00.000Z')
    expect(iso(second?.end)).toBe('2026-10-16T23:00:00.000Z')
  })

  it('rejects an invalid period length', () => {
    expect(() =>
      period('2026-10-16T12:00:00.000Z', { ...contest, draw: { periodDays: 0 } }),
    ).toThrow(RangeError)
  })
})

describe('startOfAlgiersDay', () => {
  it('is 23:00 UTC the day before', () => {
    expect(startOfAlgiersDay('2026-10-15')?.toISOString()).toBe('2026-10-14T23:00:00.000Z')
  })

  it.each(['2026-02-30', '15/10/2026', '', '2026-13-01'])('rejects %j', (day) => {
    expect(startOfAlgiersDay(day)).toBeNull()
  })
})

describe('startOfAlgiersDayOf and endOfAlgiersDayOf', () => {
  // The admin's day-only picker sends noon UTC on the chosen day.
  it.each([
    ['a day picked in the admin', '2026-10-15T12:00:00.000Z'],
    ['early morning in Algiers', '2026-10-14T23:30:00.000Z'],
    ['late evening in Algiers', '2026-10-15T22:59:59.999Z'],
  ])('spans the whole Algiers day for %s', (_, instant) => {
    expect(startOfAlgiersDayOf(new Date(instant)).toISOString()).toBe('2026-10-14T23:00:00.000Z')
    expect(endOfAlgiersDayOf(new Date(instant)).toISOString()).toBe('2026-10-15T22:59:59.999Z')
  })

  it('leaves a value it already produced unchanged', () => {
    const start = startOfAlgiersDayOf(new Date('2026-10-15T12:00:00.000Z'))
    const end = endOfAlgiersDayOf(new Date('2026-10-15T12:00:00.000Z'))
    expect(startOfAlgiersDayOf(start)).toEqual(start)
    expect(endOfAlgiersDayOf(end)).toEqual(end)
  })
})

describe('drawPeriodsOf', () => {
  it('lists every period back to back, from the contest start to its end', () => {
    const periods = drawPeriodsOf(contest)

    expect(periods.map(({ index }) => index)).toEqual([0, 1, 2, 3, 4, 5])
    expect(iso(periods[0].start)).toBe(contest.startAt)
    expect(iso(periods.at(-1)?.end)).toBe(contest.endAt)
    for (let i = 1; i < periods.length; i++) {
      expect(periods[i].start).toEqual(periods[i - 1].end)
    }
  })
})
