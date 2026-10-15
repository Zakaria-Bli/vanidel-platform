import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { RichText } from '@/components/shared/RichText'
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
        <div className="font-medium text-primary-ink">
          <ContestDates contest={contest} />
        </div>
      </div>
      {contest.description && <RichText data={contest.description} className="text-body-lg" />}
      {contestPhase(contest) === 'open' && (
        <a
          href={`#${participationAnchor}`}
          className={buttonVariants({ size: 'lg', className: 'self-start' })}
        >
          {t('cta')}
        </a>
      )}
    </header>
  )
}
