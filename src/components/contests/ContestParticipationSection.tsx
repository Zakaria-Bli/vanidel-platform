import { getFormatter, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { contestPhase } from '@/modules/contests/domain/phase'
import type { Contest } from '@/payload-types'

import { participationAnchor } from './ContestHero'

/**
 * Where visitors take part: the form while the contest is open, otherwise when it opens or that
 * it has ended. The phase is re-checked on submission, so a cached page cannot let a late entry in.
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
      className="flex scroll-mt-4 flex-col gap-4 rounded-2xl border-2 border-primary/20 p-4 sm:p-6"
    >
      <h2 id="participation-title">{t('formTitle')}</h2>
      {phase === 'open' && children}
      {phase === 'scheduled' && (
        <p>
          {t('opensOn', {
            date: format.dateTime(new Date(contest.startAt), {
              dateStyle: 'long',
              timeStyle: 'short',
            }),
          })}
        </p>
      )}
      {(phase === 'closed' || phase === 'archived') && <p>{t('ended')}</p>}
    </section>
  )
}
