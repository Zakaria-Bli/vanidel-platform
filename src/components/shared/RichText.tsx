import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'

import { cn } from '@/lib/utils'

/** Text from the admin's rich-text editor, with its lists and spacing (styles/rich-text.css). */
export function RichText({ className, ...props }: React.ComponentProps<typeof PayloadRichText>) {
  return <PayloadRichText className={cn('rich-text', className)} {...props} />
}
