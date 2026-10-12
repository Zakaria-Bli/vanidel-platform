import { describe, expect, it } from 'vitest'

import { drawPeriodFor, type DrawSettings } from './drawPeriod'

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
