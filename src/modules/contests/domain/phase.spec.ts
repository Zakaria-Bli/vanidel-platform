import { describe, expect, it } from 'vitest'

import { contestPhase, type ContestSchedule } from './phase'

const published: ContestSchedule = {
  status: 'published',
  startAt: '2026-10-15T09:00:00.000Z',
  endAt: '2026-11-15T23:00:00.000Z',
}

describe('contestPhase', () => {
  it('keeps draft and archived contests in their stored state', () => {
    const now = new Date('2026-10-20T00:00:00.000Z')
    expect(contestPhase({ ...published, status: 'draft' }, now)).toBe('draft')
    expect(contestPhase({ ...published, status: 'archived' }, now)).toBe('archived')
  })

  it('derives scheduled, open and closed from the dates', () => {
    expect(contestPhase(published, new Date('2026-10-15T08:59:59.999Z'))).toBe('scheduled')
    expect(contestPhase(published, new Date('2026-10-15T09:00:00.000Z'))).toBe('open')
    expect(contestPhase(published, new Date('2026-11-15T22:59:59.999Z'))).toBe('open')
    expect(contestPhase(published, new Date('2026-11-15T23:00:00.000Z'))).toBe('closed')
  })
})
