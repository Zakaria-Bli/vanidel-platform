import { FileText } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { buttonVariants } from '@/components/ui/button'
import { populated } from '@/lib/media'
import type { Contest } from '@/payload-types'

export async function ContestRules({ contest }: { contest: Contest }) {
  const regulation = populated(contest.regulation)
  if (!regulation?.url) return null
  const t = await getTranslations('contests')

  return (
    <a
      href={regulation.url}
      target="_blank"
      rel="noopener"
      className={buttonVariants({ variant: 'outline', className: 'self-start' })}
    >
      <FileText aria-hidden />
      {t('regulation')}
    </a>
  )
}
