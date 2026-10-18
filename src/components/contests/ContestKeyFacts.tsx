import { CalendarDays, Gift, Receipt, Trophy, type LucideIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import type { Contest } from '@/payload-types'

import { ContestDates } from './ContestDates'

/** The contest at a glance: when it runs, how often it draws, what there is to win and how to enter. */
export async function ContestKeyFacts({ contest }: { contest: Contest }) {
  const t = await getTranslations('contests.facts')
  const prizes = (contest.prizes ?? []).reduce((total, { quantity }) => total + (quantity ?? 1), 0)

  return (
    <section aria-labelledby="facts-title">
      <h2 id="facts-title" className="sr-only">
        {t('title')}
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Fact icon={CalendarDays} label={t('period')}>
          <ContestDates contest={contest} variant="range" />
        </Fact>
        <Fact icon={Trophy} label={t('draw')}>
          {t('drawValue', {
            days: contest.draw.periodDays,
            winners: contest.draw.winnersPerDraw,
          })}
          {contest.draw.poolScope === 'sinceStart' && (
            <span className="block text-small font-normal text-muted-foreground">
              {t('drawPoolSinceStart')}
            </span>
          )}
        </Fact>
        {prizes > 0 && (
          <Fact icon={Gift} label={t('prizes')}>
            {t('prizesValue', { count: prizes })}
          </Fact>
        )}
        <Fact icon={Receipt} label={t('entry')}>
          {t('entryValue')}
          <span className="block text-small font-normal text-muted-foreground">
            {t('entryLimit', { limit: contest.entryLimitPerPhone })}
          </span>
        </Fact>
      </dl>
    </section>
  )
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-card border bg-card p-4 sm:p-5">
      <Icon aria-hidden className="size-6 text-primary" />
      <dt className="text-eyebrow text-muted-foreground uppercase">{label}</dt>
      <dd className="text-label">{children}</dd>
    </div>
  )
}
