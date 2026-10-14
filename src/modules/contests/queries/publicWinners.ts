import type { Payload } from 'payload'

import type { Locale } from '@/i18n/config'
import { populated } from '@/lib/media'
import type { Media } from '@/payload-types'

import type { PublicWinner } from '../domain/publicWinners'

/**
 * Published, non-voided winners of the given contests (SPECIFICATION §11). Winners are staff-only,
 * so this reads them with full access and returns only what public pages may show: the display
 * name, rank, draw period and optional photo or video, never the participation. Callers pass only
 * contests a visitor can already see.
 */
export async function listPublicWinners(
  payload: Payload,
  contestIds: number[],
  locale: Locale,
): Promise<PublicWinner<Media>[]> {
  if (contestIds.length === 0) return []
  const { docs } = await payload.find({
    collection: 'winners',
    where: {
      published: { equals: true },
      voided: { not_equals: true },
      'draw.contest': { in: contestIds },
    },
    select: { draw: true, rank: true, publicDisplayName: true, publicMedia: true },
    populate: { draws: { contest: true, periodStart: true, periodEnd: true } },
    depth: 1,
    locale,
    pagination: false,
    overrideAccess: true,
  })

  return docs.flatMap((winner) => {
    const draw = winner.draw
    if (typeof draw !== 'object') return []
    const contestId = typeof draw.contest === 'object' ? draw.contest.id : draw.contest
    return [
      {
        id: winner.id,
        contestId,
        name: winner.publicDisplayName,
        rank: winner.rank,
        periodStart: draw.periodStart,
        periodEnd: draw.periodEnd,
        media: populated(winner.publicMedia),
      },
    ]
  })
}
