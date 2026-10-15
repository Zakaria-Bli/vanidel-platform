import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import chef from '@/assets/brand/photos/vanidel-chef-ambassador.png'
import { EmptyState } from '@/components/shared/EmptyState'
import { SocialLinks } from '@/components/shared/SocialLinks'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/config'
import { Link } from '@/i18n/navigation'

/**
 * No contest running: the chef points at the message, as in the charter's closing banner. His
 * gesture points left and the photo is never mirrored (the logo on his apron would read backwards),
 * so he stays on the physical right in both languages; in Arabic the message is on his left too.
 */
export async function NoCurrentContest({ locale }: { locale: Locale }) {
  const t = await getTranslations('contests.empty')

  return (
    <section className="relative flex flex-col overflow-hidden rounded-band bg-secondary md:min-h-96 md:flex-row md:items-center">
      {/* Physically on the left from tablets up, in both directions, so the chef points at it. */}
      <div className="flex flex-col items-start gap-5 p-6 pb-0 sm:p-10 sm:pb-0 md:mr-auto md:w-[55%] md:p-12 md:pb-12">
        <h2 className="text-h2">{t('currentTitle')}</h2>
        <p className="max-w-md text-body-lg text-muted-foreground">{t('currentText')}</p>
        <Button nativeButton={false} render={<Link href="/concours/archives" />} size="lg">
          {t('currentAction')}
        </Button>
        <SocialLinks locale={locale} label={t('follow')} className="text-primary-ink" />
      </div>
      <div className="relative mt-4 ml-auto h-64 w-full sm:h-80 md:absolute md:right-0 md:bottom-0 md:mt-0 md:h-[94%] md:w-[45%]">
        <Image
          src={chef}
          alt=""
          sizes="(min-width: 768px) 45vw, 100vw"
          className="size-full object-contain object-right-bottom"
        />
      </div>
    </section>
  )
}

/** No contest has ended yet. */
export async function NoPastContest() {
  const t = await getTranslations('contests.empty')

  return (
    <EmptyState
      title={t('pastTitle')}
      description={t('pastText')}
      actions={
        <Button nativeButton={false} render={<Link href="/concours" />} size="lg">
          {t('pastAction')}
        </Button>
      }
    />
  )
}
