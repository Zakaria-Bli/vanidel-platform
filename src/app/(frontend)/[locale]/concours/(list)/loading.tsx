import { getTranslations } from 'next-intl/server'

import { ContestListSkeleton } from '@/components/contests/ContestList'
import { ContestsHero } from '@/components/contests/ContestsHero'
import { ContestsTabs } from '@/components/contests/ContestsTabs'
import { Container } from '@/components/shared/Container'

/** The real header and tabs at once, then card placeholders until the contests arrive. */
export default async function ContestsLoading() {
  const t = await getTranslations('contests')

  return (
    <Container className="flex flex-col gap-block pt-block pb-section">
      <ContestsHero
        tone="red"
        eyebrow={t('eyebrow')}
        title={t('listHero.title')}
        text={t('listHero.text')}
      />
      <ContestsTabs active="current" />
      <p role="status" className="sr-only">
        {t('loading')}
      </p>
      <ContestListSkeleton />
    </Container>
  )
}
