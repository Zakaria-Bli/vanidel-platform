import { useTranslations } from 'next-intl'

import { Container } from '@/components/shared/Container'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export default function NotFoundPage() {
  const t = useTranslations('notFound')

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center py-section">
      <EmptyState
        heading="h1"
        title={t('title')}
        description={t('description')}
        actions={
          <Button nativeButton={false} render={<Link href="/concours" />} size="lg">
            {t('backHome')}
          </Button>
        }
      />
    </Container>
  )
}
