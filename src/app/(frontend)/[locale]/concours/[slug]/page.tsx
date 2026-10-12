import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { ContestDates } from '@/components/contests/ContestDates'
import { Container } from '@/components/shared/Container'
import { locales, type Locale } from '@/i18n/config'
import { getPathname, Link } from '@/i18n/navigation'
import { getCachedPublicContest } from '@/modules/contests/queries/cached'
import type { Media } from '@/payload-types'

// Generated on the first visit, then served from cache: edits revalidate it immediately, and it
// rebuilds every minute so a contest opening or closing shows without an edit. Nothing is built
// ahead of time, so builds need no database.
export const revalidate = 60

export function generateStaticParams() {
  return []
}

type Props = PageProps<'/[locale]/concours/[slug]'>

const loadContest = getCachedPublicContest

const media = (value: unknown): Media | null =>
  typeof value === 'object' && value !== null ? (value as Media) : null

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale: segment } = await params
  // Already checked against the supported locales in src/i18n/request.ts.
  const locale = segment as Locale
  const contest = await loadContest(slug, locale)
  if (!contest) return {}

  const title = contest.seo?.title || contest.title
  const description = contest.seo?.description ?? undefined
  const share = media(contest.shareMedia)
  const image = share?.sizes?.og?.url ?? share?.url

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
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
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
  const regulation = media(contest.regulation)

  return (
    <Container size="narrow" className="flex flex-col gap-6 py-10">
      <h1>{contest.title}</h1>
      <ContestDates contest={contest} />
      {contest.description && <RichText data={contest.description} />}
      {(contest.steps?.length ?? 0) > 0 && (
        <section className="flex flex-col gap-2">
          <h2>{t('howToTakePart')}</h2>
          <ol className="list-decimal ps-6">
            {contest.steps?.map((step) => (
              <li key={step.id}>{step.text}</li>
            ))}
          </ol>
        </section>
      )}
      {(contest.prizes?.length ?? 0) > 0 && (
        <section className="flex flex-col gap-2">
          <h2>{t('prizes')}</h2>
          <ul className="list-disc ps-6">
            {contest.prizes?.map((prize) => (
              <li key={prize.id}>
                {prize.quantity ? `${prize.quantity} × ` : ''}
                {prize.title}
              </li>
            ))}
          </ul>
        </section>
      )}
      {regulation?.url && <a href={regulation.url}>{t('regulation')}</a>}
      <Link href="/concours">{t('backToContests')}</Link>
    </Container>
  )
}
