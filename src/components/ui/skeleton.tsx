import { cn } from '@/lib/utils'

/** A placeholder block while content loads; hidden from assistive technology. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn('rounded-lg bg-muted motion-safe:animate-pulse', className)}
      {...props}
    />
  )
}

export { Skeleton }
