import { Clock } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { contestCountdown } from '@/modules/contests/domain/countdown'
import { contestPhase } from '@/modules/contests/domain/phase'
import type { Contest } from '@/payload-types'

/**
 * "En cours", "Bientôt" or "Terminé", from the contest's dates (contestPhase), so it can never
 * contradict them. `inverse` sits on a red band.
 */
export async function ContestStatusBadge({
  contest,
  inverse = false,
  className,
}: {
  contest: Contest
  inverse?: boolean
  className?: string
}) {
  const t = await getTranslations('contests.status')
  const phase = contestPhase(contest)

  if (phase === 'open') {
    return (
      <Badge variant={inverse ? 'inverse' : 'default'} className={className}>
        <span aria-hidden className="size-2 rounded-full bg-current motion-safe:animate-pulse" />
        {t('open')}
      </Badge>
    )
  }
  if (phase === 'scheduled') {
    return (
      <Badge variant={inverse ? 'inverse' : 'blue'} className={className}>
        {t('scheduled')}
      </Badge>
    )
  }
  return (
    <Badge variant={inverse ? 'inverse' : 'neutral'} className={className}>
      {t('closed')}
    </Badge>
  )
}

/** "Plus que 5 jours", "Se termine aujourd'hui", "Ouvre demain"…; nothing once it has ended. */
export async function ContestCountdown({
  contest,
  className,
}: {
  contest: Contest
  className?: string
}) {
  const countdown = contestCountdown(contest)
  if (!countdown) return null
  const t = await getTranslations('contests.countdown')

  return (
    <p className={cn('flex items-center gap-1.5 text-label', className)}>
      <Clock aria-hidden className="size-4 shrink-0" />
      {t(countdown.kind, { days: countdown.days })}
    </p>
  )
}
