import Image from 'next/image'
import { getFormatter, getTranslations } from 'next-intl/server'

import { imageSize } from '@/lib/media'
import { winnersByPeriod, type PublicWinner } from '@/modules/contests/domain/publicWinners'
import type { Media } from '@/payload-types'

/** Published winners by draw period, latest first (SPECIFICATION §11). Nothing until one exists. */
export async function ContestWinners({ winners }: { winners: PublicWinner<Media>[] }) {
  if (winners.length === 0) return null
  const t = await getTranslations('contests')
  const format = await getFormatter()
  // Periods end exclusively at midnight; the last day shown is the one before.
  const range = (start: string, end: string) =>
    format.dateTimeRange(new Date(start), new Date(Date.parse(end) - 1), { dateStyle: 'long' })

  return (
    <section className="flex flex-col gap-4" aria-labelledby="winners-title">
      <h2 id="winners-title">{t('winners')}</h2>
      {winnersByPeriod(winners).map((period) => (
        <div key={period.periodStart} className="flex flex-col gap-3">
          <h3 className="text-base font-medium text-muted-foreground">
            {t('winnersPeriod', { range: range(period.periodStart, period.periodEnd) })}
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {period.winners.map((winner) => (
              <li key={winner.id} className="flex flex-col gap-3 rounded-xl border p-4">
                {winner.media && <WinnerMedia media={winner.media} />}
                <p dir="auto" className="text-lg font-medium">
                  {winner.name}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

function WinnerMedia({ media }: { media: Media }) {
  if (media.mimeType?.startsWith('video/') && media.url) {
    return (
      <video
        src={media.url}
        controls
        playsInline
        preload="metadata"
        aria-label={media.alt}
        className="aspect-video w-full rounded-lg bg-muted"
      />
    )
  }
  const image = media.mimeType?.startsWith('image/') ? imageSize(media, 'og') : null
  if (!image) return null
  return (
    <Image
      src={image.url}
      width={image.width}
      height={image.height}
      alt={media.alt}
      sizes="(min-width: 640px) 50vw, 100vw"
      className="aspect-[1200/630] w-full rounded-lg object-cover"
    />
  )
}
