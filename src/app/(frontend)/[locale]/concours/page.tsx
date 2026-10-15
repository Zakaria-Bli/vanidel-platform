import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ContestList } from '@/components/contests/ContestList'
import { Container } from '@/components/shared/Container'
import type { Locale } from '@/i18n/config'
import { Link } from '@/i18n/navigation'
import { getCachedCurrentContests } from '@/modules/contests/queries/cached'

// Rendered per request, never at build (CI builds have no database); the contest data itself
// comes from the cache (src/modules/contests/queries/cached.ts).
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
    <Container size="narrow" className="flex flex-col gap-6 py-section">
      <h1>{t('current')}</h1>
      {contests.length > 0 ? <ContestList contests={contests} /> : <p>{t('noCurrent')}</p>}
      <Link href="/concours/archives">{t('archiveLink')}</Link>
    </Container>
  )
}
