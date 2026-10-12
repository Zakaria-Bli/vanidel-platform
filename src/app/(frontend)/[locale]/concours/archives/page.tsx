import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'

import { ContestList } from '@/components/contests/ContestList'
import { Container } from '@/components/shared/Container'
import type { Locale } from '@/i18n/config'
import { Link } from '@/i18n/navigation'
import { listPastContests } from '@/modules/contests/queries/publicContests'
import config from '@/payload.config'

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
  const payload = await getPayload({ config })
  const contests = await listPastContests(payload, locale as Locale)

  return (
    <Container size="narrow" className="flex flex-col gap-6 py-10">
      <h1>{t('archiveTitle')}</h1>
      {contests.length > 0 ? <ContestList contests={contests} /> : <p>{t('noArchive')}</p>}
      <Link href="/concours">{t('backToContests')}</Link>
    </Container>
  )
}
