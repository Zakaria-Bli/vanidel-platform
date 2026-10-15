import { cn } from '@/lib/utils'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /** `default` 72rem for page content, `narrow` 56rem, `prose` 42rem for reading, `wide` 96rem. */
  size?: 'default' | 'wide' | 'narrow' | 'prose'
}

export function Container({ children, size = 'default', className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        {
          'max-w-6xl': size === 'default',
          'max-w-screen-2xl': size === 'wide',
          'max-w-4xl': size === 'narrow',
          'max-w-2xl': size === 'prose',
        },
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
