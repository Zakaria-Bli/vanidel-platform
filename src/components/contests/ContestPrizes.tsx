import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { imageSize, populated } from '@/lib/media'
import type { Contest } from '@/payload-types'

export async function ContestPrizes({ prizes }: { prizes: NonNullable<Contest['prizes']> }) {
  if (prizes.length === 0) return null
  const t = await getTranslations('contests')

  return (
    <section className="flex flex-col gap-4" aria-labelledby="prizes-title">
      <h2 id="prizes-title">{t('prizes')}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {prizes.map((prize, index) => {
          const media = populated(prize.media)
          const image = media && imageSize(media, 'og')
          return (
            <li key={prize.id ?? index} className="flex flex-col gap-3 rounded-xl border p-4">
              {image && (
                <Image
                  src={image.url}
                  width={image.width}
                  height={image.height}
                  alt={media?.alt ?? ''}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="aspect-[1200/630] w-full rounded-lg object-cover"
                />
              )}
              <h3>
                {prize.quantity && prize.quantity > 1 && (
                  <span className="text-primary">{prize.quantity} × </span>
                )}
                {prize.title}
              </h3>
              {prize.description && (
                <p className="whitespace-pre-line text-muted-foreground">{prize.description}</p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
