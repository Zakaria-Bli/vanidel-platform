import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ContestList } from '@/components/contests/ContestList'
import { NoPastContest } from '@/components/contests/ContestsEmpty'
import { ContestsHero } from '@/components/contests/ContestsHero'
import { ContestsTabs } from '@/components/contests/ContestsTabs'
import { Container } from '@/components/shared/Container'
import type { Locale } from '@/i18n/config'
import { getCachedPastContests, getCachedPublicWinners } from '@/modules/contests/queries/cached'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contests')
  return { title: t('archiveTitle') }
}

export default async function ContestArchivePage({
  params,
}: PageProps<'/[locale]/concours/archives'>) {
  const { locale } = await params
  const t = await getTranslations('contests')
  const contests = await getCachedPastContests(locale as Locale)
  const winners = await getCachedPublicWinners(
    contests.map(({ id }) => id),
    locale as Locale,
  )

  return (
    <Container className="flex flex-col gap-block pt-block pb-section">
      <ContestsHero
        tone="blue"
        eyebrow={t('eyebrow')}
        title={t('archiveHero.title')}
        text={t('archiveHero.text')}
      />
      <ContestsTabs active="past" />
      {contests.length > 0 ? (
        <ContestList contests={contests} winners={winners} />
      ) : (
        <NoPastContest />
      )}
    </Container>
  )
}
