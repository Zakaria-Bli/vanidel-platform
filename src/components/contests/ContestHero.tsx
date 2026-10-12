import { RichText } from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { buttonVariants } from '@/components/ui/button'
import { imageSize, populated } from '@/lib/media'
import { contestPhase } from '@/modules/contests/domain/phase'
import type { Contest } from '@/payload-types'

import { ContestDates } from './ContestDates'

export const participationAnchor = 'participer'

export async function ContestHero({ contest }: { contest: Contest }) {
  const t = await getTranslations('contests')
  const hero = populated(contest.heroMedia)
  const image = hero && imageSize(hero, 'hero')

  return (
    <header className="flex flex-col gap-5">
      {image && (
        <Image
          src={image.url}
          width={image.width}
          height={image.height}
          alt={hero?.alt ?? ''}
          priority
          sizes="(min-width: 896px) 896px, 100vw"
          className="aspect-[16/9] w-full rounded-xl object-cover"
        />
      )}
      <div className="flex flex-col gap-3">
        <h1>{contest.title}</h1>
        <div className="font-medium text-primary-hover">
          <ContestDates contest={contest} />
        </div>
      </div>
      {contest.description && (
        <div className="text-lg leading-relaxed">
          <RichText data={contest.description} />
        </div>
      )}
      {contestPhase(contest) === 'open' && (
        <a
          href={`#${participationAnchor}`}
          className={buttonVariants({ size: 'lg', className: 'h-12 self-start px-6 text-base' })}
        >
          {t('cta')}
        </a>
      )}
    </header>
  )
}
