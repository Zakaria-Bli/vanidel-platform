import { Clock } from 'lucide-react'
import { getFormatter, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { contestPhase } from '@/modules/contests/domain/phase'
import type { Contest } from '@/payload-types'

import { participationAnchor } from './anchors'

/**
 * Where visitors take part: a cream band with the form in a white card while the contest is open,
 * otherwise when it opens or that it has ended. The phase is re-checked on submission, so a cached
 * page cannot let a late entry in.
 */
export async function ContestParticipationSection({
  contest,
  children,
}: {
  contest: Contest
  children: ReactNode
}) {
  const t = await getTranslations('contests')
  const format = await getFormatter()
  const phase = contestPhase(contest)

  return (
    <section
      id={participationAnchor}
      aria-labelledby="participation-title"
      className="scroll-mt-24 rounded-band bg-secondary px-4 py-8 sm:px-8 md:py-12"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h2 id="participation-title">{t('formTitle')}</h2>
          {phase === 'open' && (
            <p className="text-muted-foreground">
              <Clock aria-hidden className="me-1.5 inline size-4 align-[-0.125em]" />
              {t('reassurance')}
            </p>
          )}
        </div>
        <div className="rounded-card bg-card p-5 text-card-foreground shadow-card sm:p-8">
          {phase === 'open' && children}
          {phase === 'scheduled' && (
            <p className="text-center text-body-lg">
              {t('opensOn', {
                date: format.dateTime(new Date(contest.startAt), {
                  dateStyle: 'long',
                  timeStyle: 'short',
                }),
              })}
            </p>
          )}
          {(phase === 'closed' || phase === 'archived') && (
            <p className="text-center text-body-lg">{t('ended')}</p>
          )}
        </div>
      </div>
    </section>
  )
}
