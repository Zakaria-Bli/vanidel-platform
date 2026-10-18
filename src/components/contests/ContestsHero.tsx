import Image from 'next/image'
import type { ReactNode } from 'react'

import flanPackshot from '@/assets/brand/packshots/vanidel-packshots-flan.png'
import mixPackshot from '@/assets/brand/packshots/vanidel-packshots-mix.png'
import { Slogan } from '@/components/shared/BrandLogo'
import { cn } from '@/lib/utils'

/**
 * The band at the top of the contest lists, like the charter's blocks: red with the baking-mix
 * boxes for current contests, blue with the flan sachets for past ones. White text on both (red
 * 4.64:1, blue 600 4.98:1); focus rings turn white.
 */
export function ContestsHero({
  tone,
  eyebrow,
  title,
  text,
}: {
  tone: 'red' | 'blue'
  eyebrow: string
  /** May hold a link, such as the current list's "Participez" down to the contests. */
  title: ReactNode
  text: string
}) {
  return (
    <section
      className={cn(
        'relative grid items-center gap-8 overflow-hidden rounded-band px-6 py-10 text-primary-foreground [--ring:var(--primary-foreground)] sm:px-10 sm:py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:px-14',
        tone === 'red' ? 'bg-primary' : 'bg-brand-blue-strong',
      )}
    >
      <div className="flex flex-col items-start gap-4">
        <p className="text-eyebrow uppercase opacity-90">{eyebrow}</p>
        <h1 className="text-display uppercase">{title}</h1>
        <p className="max-w-md text-body-lg">{text}</p>
        <Slogan tone="white" className="mt-2 h-12 w-auto sm:h-14" />
      </div>
      <Image
        src={tone === 'red' ? mixPackshot : flanPackshot}
        alt=""
        priority
        sizes="(min-width: 1152px) 560px, (min-width: 768px) 50vw, 90vw"
        className="mx-auto max-h-44 w-auto object-contain drop-shadow-xl sm:max-h-56 md:max-h-72"
      />
    </section>
  )
}
