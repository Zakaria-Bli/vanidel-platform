import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/*
 * Sizes are 40, 44 and 52px tall (sm, default, lg): 44px is the smallest comfortable touch target,
 * so `sm` is for spots with room around it. The `inverse` variants sit on red or blue bands.
 */
const variants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-button whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-150 ease-brand outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        outline:
          'border-input bg-background text-foreground hover:border-foreground/30 hover:bg-muted aria-expanded:bg-muted',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)] aria-expanded:bg-secondary',
        ghost: 'hover:bg-muted hover:text-foreground aria-expanded:bg-muted',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:outline-destructive',
        link: 'text-primary-ink underline-offset-4 hover:underline',
        // White button on a red or blue band; red text keeps 7.5:1.
        inverse:
          'bg-primary-foreground text-primary-ink hover:bg-secondary focus-visible:outline-primary-foreground',
        // Outlined white on a red or blue band.
        'outline-inverse':
          'border-primary-foreground/80 text-primary-foreground hover:bg-primary-foreground/10 focus-visible:outline-primary-foreground',
      },
      size: {
        default:
          'h-11 gap-2 px-5 has-data-[icon=inline-end]:pe-4 has-data-[icon=inline-start]:ps-4',
        xs: "h-8 gap-1 rounded-md px-2.5 text-small has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2 [&_svg:not([class*='size-'])]:size-4",
        sm: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3 [&_svg:not([class*='size-'])]:size-4",
        lg: 'h-13 gap-2 px-7 has-data-[icon=inline-end]:pe-6 has-data-[icon=inline-start]:ps-6',
        icon: 'size-11',
        'icon-xs': "size-8 rounded-md [&_svg:not([class*='size-'])]:size-4",
        'icon-sm': 'size-10',
        'icon-lg': 'size-13',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

/** Button classes for links styled as buttons, merged so a variant's border replaces the base one. */
function buttonVariants(props?: Parameters<typeof variants>[0]) {
  return cn(variants(props))
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof variants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
}

export { Button, buttonVariants }
