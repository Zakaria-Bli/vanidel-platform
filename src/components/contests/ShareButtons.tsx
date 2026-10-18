'use client'

import { Check, Link2, MessageCircle, Share2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useSyncExternalStore } from 'react'

import { NetworkIcon } from '@/components/shared/NetworkIcon'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  contestShareUrl,
  instagramUrl,
  whatsappShareUrl,
  type ShareChannel,
} from '@/modules/analytics/domain/share'

export interface ShareButtonsProps {
  siteUrl: string
  slug: string
  title: string
  className?: string
}

const buttonClass = 'px-4'

const outlineLink = buttonVariants({ variant: 'outline', className: buttonClass })

const noSubscription = () => () => {}
const hasShareSheet = () => typeof navigator.share === 'function'

/**
 * Share actions (SPECIFICATION §16–17): the device share sheet where there is one (mobile),
 * WhatsApp, Instagram and copying the link everywhere. Instagram takes no link from the web, so its
 * button copies the link and opens Instagram to paste it. Each link is tagged with its channel.
 */
export function ShareButtons({ siteUrl, slug, title, className }: ShareButtonsProps) {
  const t = useTranslations('share')
  const link = (channel: ShareChannel) => contestShareUrl(siteUrl, slug, channel)
  const text = t('text', { title })

  // Known only in the browser; the server renders the buttons every device has.
  const canShareLink = useSyncExternalStore(noSubscription, hasShareSheet, () => false)
  const [copied, setCopied] = useState<'copy' | 'instagram' | null>(null)

  async function share() {
    try {
      await navigator.share({ title, text, url: link('native') })
    } catch {
      // Dismissed by the visitor, or refused by the browser: nothing to report.
    }
  }

  async function copy(channel: 'copy' | 'instagram') {
    try {
      await navigator.clipboard.writeText(link(channel))
      setCopied(channel)
      setTimeout(() => setCopied(null), 4000)
    } catch {
      // No clipboard access (insecure context, permissions): the other buttons remain.
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
        {canShareLink && (
          <Button type="button" className={buttonClass} onClick={share}>
            <Share2 aria-hidden />
            {t('share')}
          </Button>
        )}
        <a
          href={whatsappShareUrl(link('whatsapp'), text)}
          target="_blank"
          rel="noopener noreferrer"
          className={outlineLink}
        >
          <MessageCircle aria-hidden />
          WhatsApp
        </a>
        {/* A link, so Instagram opens within the tap; the copy runs alongside. */}
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void copy('instagram')}
          className={outlineLink}
        >
          <NetworkIcon platform="instagram" className="size-5" />
          Instagram
        </a>
        <Button
          type="button"
          variant="outline"
          className={buttonClass}
          onClick={() => copy('copy')}
        >
          {copied === 'copy' ? <Check aria-hidden /> : <Link2 aria-hidden />}
          {copied === 'copy' ? t('copied') : t('copy')}
        </Button>
      </div>
      {/* Read out after either copy; shown only for Instagram, where the next step is not obvious. */}
      <p
        aria-live="polite"
        className={cn('text-small text-muted-foreground', copied !== 'instagram' && 'sr-only')}
      >
        {copied === 'instagram' ? t('instagramCopied') : copied === 'copy' ? t('copied') : null}
      </p>
    </div>
  )
}
