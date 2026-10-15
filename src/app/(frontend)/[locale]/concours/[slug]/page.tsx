import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'

import { ContestHero } from '@/components/contests/ContestHero'
import { ContestParticipationSection } from '@/components/contests/ContestParticipationSection'
import { ContestPrizes } from '@/components/contests/ContestPrizes'
import { ContestRules } from '@/components/contests/ContestRules'
import { ContestShare, ContestShareButtons } from '@/components/contests/ContestShare'
import { ContestSteps } from '@/components/contests/ContestSteps'
import { ContestWinners } from '@/components/contests/ContestWinners'
import { ParticipationForm } from '@/components/contests/ParticipationForm'
import { PreviewBanner } from '@/components/contests/PreviewBanner'
import { Container } from '@/components/shared/Container'
import { locales, type Locale } from '@/i18n/config'
import { getPathname, Link } from '@/i18n/navigation'
import { contestVisual, defaultShareImage, populated } from '@/lib/media'
import { isStaffPreview } from '@/lib/preview'
import { contestPhase } from '@/modules/contests/domain/phase'
import { getCachedPublicContest, getCachedPublicWinners } from '@/modules/contests/queries/cached'
import { getContestForPreview } from '@/modules/contests/queries/publicContests'
import type { Contest } from '@/payload-types'
import config from '@/payload.config'

import { participate } from './actions'

// Generated on the first visit, then served from cache: edits revalidate it immediately, and it
// rebuilds every minute so a contest opening or closing shows without an edit. Nothing is built
// ahead of time, so builds need no database.
export const revalidate = 60

export function generateStaticParams() {
  return []
}

type Props = PageProps<'/[locale]/concours/[slug]'>

/**
 * The contest visitors see, or for staff previewing (SPECIFICATION §5, USER_FLOWS §6) the latest
 * saved version whatever its status, shown as it will look once published.
 */
async function loadContest(
  slug: string,
  locale: Locale,
): Promise<{ contest: Contest | null; preview: Contest['status'] | null }> {
  if (await isStaffPreview()) {
    const contest = await getContestForPreview(await getPayload({ config }), slug, locale)
    return {
      contest: contest && { ...contest, status: 'published' },
      preview: contest?.status ?? null,
    }
  }
  return { contest: await getCachedPublicContest(slug, locale), preview: null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale: segment } = await params
  // Already checked against the supported locales in src/i18n/request.ts.
  const locale = segment as Locale
  const { contest } = await loadContest(slug, locale)
  if (!contest) return {}

  const title = contest.seo?.title || contest.title
  const description = contest.seo?.description ?? undefined
  // The share image, else the hero, else the brand's: a link preview without a picture is easily
  // scrolled past.
  const visual = contestVisual(contest) ?? defaultShareImage
  const images = [{ url: visual.url, width: visual.width, height: visual.height, alt: title }]

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
      // Open Graph wants language_TERRITORY.
      locale: `${locale}_DZ`,
      type: 'website',
      url: getPathname({ href: `/concours/${slug}`, locale }),
      siteName: 'Vanidel',
      images,
    },
    twitter: { card: 'summary_large_image', title, description, images },
  }
}

export default async function ContestPage({ params }: Props) {
  const { slug, locale: segment } = await params
  // Already checked against the supported locales in src/i18n/request.ts.
  const locale = segment as Locale
  const { contest, preview } = await loadContest(slug, locale)
  if (!contest) notFound()

  const t = await getTranslations('contests')
  const winners = <ContestWinners winners={await getCachedPublicWinners([contest.id], locale)} />
  // Once a contest has ended, its winners are what visitors come for.
  const ended = ['closed', 'archived'].includes(contestPhase(contest))

  return (
    <Container size="narrow" className="flex flex-col gap-10 pt-2 pb-16">
      {preview && <PreviewBanner status={preview} />}
      <ContestHero contest={contest} />
      {ended && winners}
      <ContestSteps steps={contest.steps ?? []} />
      <ContestPrizes prizes={contest.prizes ?? []} />
      {!ended && winners}
      <ContestRules contest={contest} />
      <ContestParticipationSection contest={contest}>
        <ParticipationForm
          contestSlug={contest.slug}
          locale={locale}
          email={contest.form?.email ?? 'optional'}
          wilayaRequired={contest.form?.wilayaRequired !== false}
          consents={(contest.consents ?? []).map(({ type, required, label, textVersion }) => ({
            type,
            required: Boolean(required),
            label,
            textVersion,
          }))}
          regulationUrl={populated(contest.regulation)?.url ?? undefined}
          share={<ContestShareButtons contest={contest} />}
          action={participate}
        />
      </ContestParticipationSection>
      <ContestShare contest={contest} />
      <Link href="/concours" className="text-primary-hover underline-offset-4 hover:underline">
        {t('backToContests')}
      </Link>
    </Container>
  )
}
