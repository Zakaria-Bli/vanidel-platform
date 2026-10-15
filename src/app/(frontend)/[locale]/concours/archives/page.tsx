import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ContestList } from '@/components/contests/ContestList'
import { Container } from '@/components/shared/Container'
import type { Locale } from '@/i18n/config'
import { Link } from '@/i18n/navigation'
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
    <Container size="narrow" className="flex flex-col gap-6 py-section">
      <h1>{t('archiveTitle')}</h1>
      {contests.length > 0 ? (
        <ContestList contests={contests} winners={winners} />
      ) : (
        <p>{t('noArchive')}</p>
      )}
      <Link href="/concours">{t('backToContests')}</Link>
    </Container>
  )
}
