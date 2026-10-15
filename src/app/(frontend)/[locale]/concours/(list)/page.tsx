import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ContestList } from '@/components/contests/ContestList'
import { NoCurrentContest } from '@/components/contests/ContestsEmpty'
import { ContestsHero } from '@/components/contests/ContestsHero'
import { ContestsTabs } from '@/components/contests/ContestsTabs'
import { Container } from '@/components/shared/Container'
import type { Locale } from '@/i18n/config'
import { getCachedCurrentContests } from '@/modules/contests/queries/cached'

// Rendered per request, never at build (CI builds have no database); the contest data itself
// comes from the cache (src/modules/contests/queries/cached.ts). In the (list) route group so its
// loading skeleton never wraps a contest page, whose 404 must be sent before streaming starts.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contests')
  return { title: t('current') }
}

export default async function ContestsPage({ params }: PageProps<'/[locale]/concours'>) {
  const { locale } = await params
  const t = await getTranslations('contests')
  const contests = await getCachedCurrentContests(locale as Locale)

  return (
    <Container className="flex flex-col gap-block pt-block pb-section">
      <ContestsHero
        tone="red"
        eyebrow={t('eyebrow')}
        title={t('listHero.title')}
        text={t('listHero.text')}
      />
      <ContestsTabs active="current" />
      {contests.length > 0 ? (
        <ContestList contests={contests} featureOpen />
      ) : (
        <NoCurrentContest locale={locale as Locale} />
      )}
    </Container>
  )
}
