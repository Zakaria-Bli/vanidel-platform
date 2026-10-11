import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import { Button } from '@/components/ui/button'
import config from '@/payload.config'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1>{user ? `Bon retour, ${user.email}` : 'Bienvenue sur Vanidel'}</h1>
      <Button nativeButton={false} render={<a href={payloadConfig.routes.admin} />} size="lg">
        Administration
      </Button>
    </div>
  )
}
