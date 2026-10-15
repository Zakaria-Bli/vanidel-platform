import { getTranslations } from 'next-intl/server'

import { ContestListSkeleton } from '@/components/contests/ContestList'
import { ContestsHero } from '@/components/contests/ContestsHero'
import { ContestsTabs } from '@/components/contests/ContestsTabs'
import { Container } from '@/components/shared/Container'

export default async function ContestArchiveLoading() {
  const t = await getTranslations('contests')

  return (
    <Container className="flex flex-col gap-block pt-block pb-section">
      <ContestsHero
        tone="blue"
        eyebrow={t('eyebrow')}
        title={t('archiveHero.title')}
        text={t('archiveHero.text')}
      />
      <ContestsTabs active="past" />
      <p role="status" className="sr-only">
        {t('loading')}
      </p>
      <ContestListSkeleton />
    </Container>
  )
}
