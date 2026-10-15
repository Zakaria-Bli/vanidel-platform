import { cn } from '@/lib/utils'

import { BrandMark } from './BrandLogo'

interface EmptyStateProps {
  title: string
  description?: React.ReactNode
  /** Buttons or links, the first one primary. */
  actions?: React.ReactNode
  /** Shown above the title; the brand mark by default. */
  illustration?: React.ReactNode
  /** `h1` on a page of its own (not found), `h2` inside a page. */
  heading?: 'h1' | 'h2'
  className?: string
  children?: React.ReactNode
}

/** A cream block for "nothing here": empty lists and pages not found. */
export function EmptyState({
  title,
  description,
  actions,
  illustration,
  heading: Heading = 'h2',
  className,
  children,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        'flex flex-col items-center gap-5 rounded-band bg-secondary px-6 py-12 text-center sm:px-10 sm:py-16',
        className,
      )}
    >
      {illustration ?? <BrandMark className="h-14 w-auto" />}
      <Heading className="max-w-xl text-h2">{title}</Heading>
      {description && <p className="max-w-lg text-body-lg text-muted-foreground">{description}</p>}
      {actions && <div className="flex flex-wrap justify-center gap-3">{actions}</div>}
      {children}
    </section>
  )
}
