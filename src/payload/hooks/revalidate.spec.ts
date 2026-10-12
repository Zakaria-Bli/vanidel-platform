import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

const revalidateTag = vi.hoisted(() => vi.fn())
vi.mock('next/cache', () => ({ revalidateTag }))

import {
  revalidateContestAfterChange,
  revalidateMediaAfterChange,
  revalidateSettingsAfterChange,
} from './revalidate'

const req = { payload: { logger: { debug: vi.fn() } } } as unknown as PayloadRequest
type Args<T extends (...args: never[]) => unknown> = Parameters<T>[0]

const tagsRevalidated = () =>
  revalidateTag.mock.calls.map(([tag, profile]) => [tag, profile.expire === 0 ? 'now' : profile])

describe('revalidation hooks', () => {
  it('revalidates the contest lists and both slugs of a renamed contest', () => {
    revalidateContestAfterChange({
      doc: { slug: 'new' },
      previousDoc: { slug: 'old' },
      req,
      context: {},
    } as unknown as Args<typeof revalidateContestAfterChange>)

    expect(tagsRevalidated()).toEqual([
      ['contests', 'now'],
      ['contest:new', 'now'],
      ['contest:old', 'now'],
    ])
  })

  it('revalidates contest pages when media changes', () => {
    revalidateMediaAfterChange({ doc: {}, req, context: {} } as unknown as Args<
      typeof revalidateMediaAfterChange
    >)
    expect(tagsRevalidated()).toEqual([['contests', 'now']])
  })

  it('revalidates settings', () => {
    revalidateSettingsAfterChange({ doc: {}, req, context: {} } as unknown as Args<
      typeof revalidateSettingsAfterChange
    >)
    expect(tagsRevalidated()).toEqual([['settings', 'now']])
  })

  it('can be skipped for writes outside Next.js', () => {
    revalidateContestAfterChange({
      doc: { slug: 'x' },
      req,
      context: { skipRevalidate: true },
    } as unknown as Args<typeof revalidateContestAfterChange>)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('never fails the write when there is no Next.js cache', () => {
    const debug = vi.fn()
    const withLogger = { payload: { logger: { debug } } } as unknown as PayloadRequest
    revalidateTag.mockImplementation(() => {
      throw new Error('static generation store missing')
    })

    try {
      revalidateContestAfterChange({
        doc: { slug: 'x' },
        req: withLogger,
        context: {},
      } as unknown as Args<typeof revalidateContestAfterChange>)
    } finally {
      revalidateTag.mockImplementation(() => undefined)
    }

    expect(debug).toHaveBeenCalledTimes(2)
  })
})
