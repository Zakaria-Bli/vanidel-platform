import { getLocale, getTranslations } from 'next-intl/server'

import { ContestCard } from '@/components/contests/ContestCard'
import { Container } from '@/components/shared/Container'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/config'
import { Link } from '@/i18n/navigation'
import { contestPhase } from '@/modules/contests/domain/phase'
import { getCachedCurrentContests } from '@/modules/contests/queries/cached'

/**
 * An unknown or unpublished contest, still answered with a 404. People arriving from an old QR code
 * or link get up to two current contests instead.
 */
export default async function ContestNotFound() {
  const t = await getTranslations('contests')
  const locale = (await getLocale()) as Locale
  const suggestions = [...(await getCachedCurrentContests(locale))]
    // Open contests first, those ending soonest leading.
    .sort(
      (a, b) =>
        Number(contestPhase(b) === 'open') - Number(contestPhase(a) === 'open') ||
        Date.parse(a.endAt) - Date.parse(b.endAt),
    )
    .slice(0, 2)

  return (
    <Container className="flex flex-1 flex-col justify-center gap-block py-section">
      <EmptyState
        heading="h1"
        title={t('notFound.title')}
        description={t('notFound.text')}
        actions={
          <>
            <Button nativeButton={false} render={<Link href="/concours" />} size="lg">
              {t('notFound.current')}
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/concours/archives" />}
              size="lg"
              variant="outline"
            >
              {t('notFound.past')}
            </Button>
          </>
        }
      />
      {suggestions.length > 0 && (
        <section aria-labelledby="suggestions-title" className="flex flex-col gap-6">
          <h2 id="suggestions-title">{t('notFound.suggestions')}</h2>
          <ul className="grid gap-6 sm:grid-cols-2">
            {suggestions.map((contest) => (
              <li key={contest.id} className="flex">
                <ContestCard contest={contest} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  )
}
