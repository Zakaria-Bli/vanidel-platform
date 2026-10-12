import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'

import { ContestList } from '@/components/contests/ContestList'
import { Container } from '@/components/shared/Container'
import type { Locale } from '@/i18n/config'
import { Link } from '@/i18n/navigation'
import { listCurrentContests } from '@/modules/contests/queries/publicContests'
import config from '@/payload.config'

// Contest pages read the database on every request (and so are never prerendered at build).
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contests')
  return { title: t('current') }
}

export default async function ContestsPage({ params }: PageProps<'/[locale]/concours'>) {
  const { locale } = await params
  const t = await getTranslations('contests')
  const payload = await getPayload({ config })
  const contests = await listCurrentContests(payload, locale as Locale)

  return (
    <Container size="narrow" className="flex flex-col gap-6 py-10">
      <h1>{t('current')}</h1>
      {contests.length > 0 ? <ContestList contests={contests} /> : <p>{t('noCurrent')}</p>}
      <Link href="/concours/archives">{t('archiveLink')}</Link>
    </Container>
  )
}
