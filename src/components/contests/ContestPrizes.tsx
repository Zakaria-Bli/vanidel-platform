import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { imageSize, populated } from '@/lib/media'
import type { Contest } from '@/payload-types'

/** The prizes as cards: picture, a red quantity pill when there are several, title and details. */
export async function ContestPrizes({ prizes }: { prizes: NonNullable<Contest['prizes']> }) {
  if (prizes.length === 0) return null
  const t = await getTranslations('contests')

  return (
    <section className="flex flex-col gap-6" aria-labelledby="prizes-title">
      <h2 id="prizes-title">{t('prizes')}</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {prizes.map((prize, index) => {
          const media = populated(prize.media)
          const image = media && imageSize(media, 'og')
          return (
            <li
              key={prize.id ?? index}
              className="flex flex-col overflow-hidden rounded-card border bg-card shadow-card"
            >
              {image && (
                <Image
                  src={image.url}
                  width={image.width}
                  height={image.height}
                  alt={media?.alt ?? ''}
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                  className="aspect-[1200/630] w-full bg-secondary object-cover"
                />
              )}
              <div className="flex flex-col gap-2 p-5">
                {prize.quantity && prize.quantity > 1 && (
                  <span className="self-start rounded-full bg-primary px-3 py-1 text-label text-primary-foreground">
                    × {prize.quantity}
                  </span>
                )}
                <h3>{prize.title}</h3>
                {prize.description && (
                  <p className="whitespace-pre-line text-muted-foreground">{prize.description}</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
