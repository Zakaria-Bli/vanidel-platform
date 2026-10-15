import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-eyebrow whitespace-nowrap uppercase [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        blue: 'bg-brand-blue-ink/10 text-brand-blue-ink',
        neutral: 'bg-muted text-muted-foreground',
        cream: 'bg-secondary text-secondary-foreground',
        inverse: 'bg-primary-foreground text-primary-ink',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
