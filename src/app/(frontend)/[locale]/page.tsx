import { headers as getHeaders } from 'next/headers.js'
import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'
import React from 'react'

import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher'
import { Button } from '@/components/ui/button'
import config from '@/payload.config'

export default async function HomePage() {
  const t = await getTranslations('home')
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="absolute inset-e-4 top-4">
        <LocaleSwitcher />
      </div>
      <h1>
        {user
          ? t.rich('welcomeBack', {
              email: user.email,
              // Keeps the LTR email address from reordering the surrounding RTL text.
              bdi: (chunks) => <bdi>{chunks}</bdi>,
            })
          : t('welcome')}
      </h1>
      <Button nativeButton={false} render={<a href={payloadConfig.routes.admin} />} size="lg">
        {t('admin')}
      </Button>
    </div>
  )
}
