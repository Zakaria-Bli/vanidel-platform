import { Eye } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import type { Contest } from '@/payload-types'

/** Shown to staff previewing a contest; leaving preview returns to the public version. */
export async function PreviewBanner({ status }: { status: Contest['status'] }) {
  const t = await getTranslations('preview')
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-card border-2 border-dashed border-primary bg-secondary p-4 text-small"
    >
      <Eye aria-hidden className="size-5 shrink-0 text-primary" />
      <p className="flex-1">
        <strong>{t('title')}.</strong> {t(status)}
      </p>
      <form method="post" action="/api/preview/exit">
        <button type="submit" className="font-medium text-primary-ink underline underline-offset-4">
          {t('exit')}
        </button>
      </form>
    </div>
  )
}
