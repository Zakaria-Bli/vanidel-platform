import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { ContestHero } from '@/components/contests/ContestHero'
import { ContestParticipationSection } from '@/components/contests/ContestParticipationSection'
import { ContestPrizes } from '@/components/contests/ContestPrizes'
import { ContestRules } from '@/components/contests/ContestRules'
import { ContestSteps } from '@/components/contests/ContestSteps'
import { Container } from '@/components/shared/Container'
import { locales, type Locale } from '@/i18n/config'
import { getPathname, Link } from '@/i18n/navigation'
import { getCachedPublicContest } from '@/modules/contests/queries/cached'
import { imageSize, populated } from '@/lib/media'

// Generated on the first visit, then served from cache: edits revalidate it immediately, and it
// rebuilds every minute so a contest opening or closing shows without an edit. Nothing is built
// ahead of time, so builds need no database.
export const revalidate = 60

export function generateStaticParams() {
  return []
}

type Props = PageProps<'/[locale]/concours/[slug]'>

const loadContest = getCachedPublicContest

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale: segment } = await params
  // Already checked against the supported locales in src/i18n/request.ts.
  const locale = segment as Locale
  const contest = await loadContest(slug, locale)
  if (!contest) return {}

  const title = contest.seo?.title || contest.title
  const description = contest.seo?.description ?? undefined
  const share = populated(contest.shareMedia)
  const image = share && imageSize(share, 'og')

  return {
    title,
    description,
    alternates: {
      canonical: getPathname({ href: `/concours/${slug}`, locale }),
      languages: Object.fromEntries(
        locales.map((code) => [code, getPathname({ href: `/concours/${slug}`, locale: code })]),
      ),
    },
    openGraph: {
      title,
      description,
      locale,
      type: 'website',
      images: image ? [image] : undefined,
    },
  }
}

export default async function ContestPage({ params }: Props) {
  const { slug, locale: segment } = await params
  // Already checked against the supported locales in src/i18n/request.ts.
  const locale = segment as Locale
  const contest = await loadContest(slug, locale)
  if (!contest) notFound()

  const t = await getTranslations('contests')

  return (
    <Container size="narrow" className="flex flex-col gap-10 pt-2 pb-16">
      <ContestHero contest={contest} />
      <ContestSteps steps={contest.steps ?? []} />
      <ContestPrizes prizes={contest.prizes ?? []} />
      <ContestRules contest={contest} />
      <ContestParticipationSection contest={contest}>{null}</ContestParticipationSection>
      <Link href="/concours" className="text-primary-hover underline-offset-4 hover:underline">
        {t('backToContests')}
      </Link>
    </Container>
  )
}
