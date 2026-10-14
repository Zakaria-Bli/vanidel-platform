/** A winner as public pages show it: never the participation behind it (SPECIFICATION §11). */
export interface PublicWinner<TMedia = unknown> {
  id: number
  contestId: number
  name: string
  rank: number
  periodStart: string
  /** Exclusive, as stored on the draw. */
  periodEnd: string
  media: TMedia | null
}

export interface WinnersOfPeriod<TMedia = unknown> {
  periodStart: string
  periodEnd: string
  winners: PublicWinner<TMedia>[]
}

/**
 * Groups winners by draw period, latest period first. A re-draw shares its original draw's period,
 * so its replacement lands with the winners it completes, ordered by rank then selection.
 */
export function winnersByPeriod<TMedia>(
  winners: PublicWinner<TMedia>[],
): WinnersOfPeriod<TMedia>[] {
  const periods = new Map<string, WinnersOfPeriod<TMedia>>()
  for (const winner of winners) {
    const key = new Date(winner.periodStart).toISOString()
    const period = periods.get(key) ?? {
      periodStart: winner.periodStart,
      periodEnd: winner.periodEnd,
      winners: [],
    }
    period.winners.push(winner)
    periods.set(key, period)
  }
  return [...periods.values()]
    .sort((a, b) => Date.parse(b.periodStart) - Date.parse(a.periodStart))
    .map((period) => ({
      ...period,
      winners: period.winners.sort((a, b) => a.rank - b.rank || a.id - b.id),
    }))
}
