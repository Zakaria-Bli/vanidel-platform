import { useTranslations } from 'next-intl'

import { Container } from '@/components/shared/Container'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export default function NotFoundPage() {
  const t = useTranslations('notFound')

  return (
    <Container
      size="narrow"
      className="flex min-h-svh flex-col items-center justify-center gap-6 text-center"
    >
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <Button nativeButton={false} render={<Link href="/concours" />} size="lg">
        {t('backHome')}
      </Button>
    </Container>
  )
}
