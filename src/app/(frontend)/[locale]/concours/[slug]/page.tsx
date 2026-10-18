import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'
import { Suspense } from 'react'

import { ContestHero, heroActionAttribute } from '@/components/contests/ContestHero'
import { ContestKeyFacts } from '@/components/contests/ContestKeyFacts'
import { ContestParticipationSection } from '@/components/contests/ContestParticipationSection'
import { ContestPrizes } from '@/components/contests/ContestPrizes'
import { ContestShareButtons } from '@/components/contests/ContestShare'
import { ContestSteps } from '@/components/contests/ContestSteps'
import { ContestWinners, WinnersSkeleton } from '@/components/contests/ContestWinners'
import { ParticipateBar } from '@/components/contests/ParticipateBar'
import { ParticipationForm } from '@/components/contests/ParticipationForm'
import { PreviewBanner } from '@/components/contests/PreviewBanner'
import { ScrollToParticipation } from '@/components/contests/ScrollToParticipation'
import { Container } from '@/components/shared/Container'
import { RichText } from '@/components/shared/RichText'
import { locales, type Locale } from '@/i18n/config'
import { getPathname, Link } from '@/i18n/navigation'
import { contestVisual, defaultShareImage, populated } from '@/lib/media'
import { isStaffPreview } from '@/lib/preview'
import { contestCountdown } from '@/modules/contests/domain/countdown'
import { contestPhase } from '@/modules/contests/domain/phase'
import { getCachedPublicContest } from '@/modules/contests/queries/cached'
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
  // Before any Suspense boundary, so an unknown contest still answers 404.
  if (!contest) notFound()

  const t = await getTranslations('contests')
  const phase = contestPhase(contest)
  const ended = phase === 'closed' || phase === 'archived'
  const countdown = contestCountdown(contest)

  return (
    <Container className="flex flex-col gap-section pt-block pb-section">
      <div className="flex flex-col gap-4 md:gap-6">
        {preview && <PreviewBanner status={preview} />}
        <Link
          href="/concours"
          className="-my-2 inline-flex items-center gap-2 self-start py-2 text-label text-primary-ink underline-offset-4 hover:underline"
        >
          <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
          {t('backToContests')}
        </Link>
        <ContestHero contest={contest} />
        <ContestKeyFacts contest={contest} />
      </div>
      {contest.description && (
        <RichText data={contest.description} className="max-w-2xl text-body-lg" />
      )}
      <ContestSteps steps={contest.steps ?? []} />
      <ContestPrizes prizes={contest.prizes ?? []} />
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
            // Always set on save; see the Contests collection.
            textVersion: textVersion ?? '',
          }))}
          regulationUrl={populated(contest.regulation)?.url ?? undefined}
          share={<ContestShareButtons contest={contest} />}
          action={participate}
        />
      </ContestParticipationSection>
      {/*
       * Below the form, folded: a draw can have up to 25 winners. Streamed, so the rest of the page
       * does not wait for them; while the contest runs there may be none yet, so nothing holds
       * their place.
       */}
      <Suspense fallback={ended ? <WinnersSkeleton /> : null}>
        <ContestWinners contestId={contest.id} locale={locale} ended={ended} />
      </Suspense>
      {/* Staff previewing a contest read it from the top. */}
      {phase === 'open' && !preview && <ScrollToParticipation />}
      {phase === 'open' && (
        <ParticipateBar
          countdown={
            countdown ? t(`countdown.${countdown.kind}`, { days: countdown.days }) : undefined
          }
          label={t('participateBar')}
          heroSelector={`[${heroActionAttribute}]`}
        />
      )}
    </Container>
  )
}
