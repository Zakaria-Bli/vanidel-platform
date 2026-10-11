import { cn } from '@/lib/utils'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  size?: 'default' | 'wide' | 'narrow'
}

export function Container({ children, size = 'default', className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        {
          'max-w-7xl': size === 'default',
          'max-w-screen-2xl': size === 'wide',
          'max-w-4xl': size === 'narrow',
        },
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
