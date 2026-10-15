import Image from 'next/image'

import logoRed from '@/assets/brand/logo/vanidel-logo-red.svg'
import logoWhite from '@/assets/brand/logo/vanidel-logo-white.svg'
import markRed from '@/assets/brand/logo/vanidel-mark-red.svg'
import markWhite from '@/assets/brand/logo/vanidel-mark-white.svg'
import sloganRed from '@/assets/brand/slogan/kolchi-yeshal-red.svg'
import sloganWhite from '@/assets/brand/slogan/kolchi-yeshal-white.svg'

/*
 * The brand artwork (docs/brand/README.md). Red goes on white or cream, white on red or blue. The
 * size comes from `className` (a height and `w-auto`). Never mirrored in Arabic.
 */

type Tone = 'red' | 'white'

interface BrandImageProps {
  tone?: Tone
  className?: string
  priority?: boolean
}

/** The full logo. Its alt text names the link or place it stands for, "Vanidel" by default. */
export function BrandLogo({
  tone = 'red',
  alt = 'Vanidel',
  ...props
}: BrandImageProps & { alt?: string }) {
  return <Image src={tone === 'red' ? logoRed : logoWhite} alt={alt} {...props} />
}

/** The "V" mark alone, for spaces where the logo would be narrower than 72px. Decorative. */
export function BrandMark({ tone = 'red', ...props }: BrandImageProps) {
  return <Image src={tone === 'red' ? markRed : markWhite} alt="" {...props} />
}

/** The slogan, كلشي يسهال, the same artwork in every language. */
export function Slogan({ tone = 'red', ...props }: BrandImageProps) {
  return (
    <Image src={tone === 'red' ? sloganRed : sloganWhite} alt="كلشي يسهال" lang="ar" {...props} />
  )
}
