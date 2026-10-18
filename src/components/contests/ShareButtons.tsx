'use client'

import { Check, Link2, MessageCircle, Share2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useSyncExternalStore } from 'react'

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
  /** The contest's share image, sent to Instagram through the phone's share sheet. */
  visual?: { url: string; filename: string } | null
  className?: string
}

const buttonClass = 'px-4'

const outlineLink = buttonVariants({ variant: 'outline', className: buttonClass })

const noSubscription = () => () => {}
const hasShareSheet = () => typeof navigator.share === 'function'

/** What was just copied, which decides the message under the buttons. */
type Notice = 'copied' | 'instagram' | 'instagramStory'

const noticeMessages = {
  copied: 'copied',
  instagram: 'instagramCopied',
  instagramStory: 'instagramStoryCopied',
} as const

/**
 * Share actions (SPECIFICATION §16–17): the device share sheet where there is one (mobile),
 * WhatsApp, Instagram and copying the link everywhere. Instagram takes no link from the web: on
 * phones its button sends the contest's visual to the share sheet, where Instagram offers Story and
 * Feed, and copies the link for a link sticker; elsewhere it copies the link and opens Instagram to
 * paste it. Each link is tagged with its channel.
 */
export function ShareButtons({ siteUrl, slug, title, visual, className }: ShareButtonsProps) {
  const t = useTranslations('share')
  const link = (channel: ShareChannel) => contestShareUrl(siteUrl, slug, channel)
  const text = t('text', { title })

  // Known only in the browser; the server renders the buttons every device has.
  const canShareLink = useSyncExternalStore(noSubscription, hasShareSheet, () => false)
  const [visualFile, setVisualFile] = useState<File | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    if (!visual || !hasShareSheet() || typeof navigator.canShare !== 'function') return
    let cancelled = false
    // Fetched ahead of the tap: the share sheet must open within the click's user activation.
    fetch(visual.url)
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (!blob || cancelled) return
        const file = new File([blob], visual.filename, { type: blob.type })
        if (navigator.canShare({ files: [file] })) setVisualFile(file)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [visual])

  function show(next: Notice, duration: number) {
    setNotice(next)
    setTimeout(() => setNotice((current) => (current === next ? null : current)), duration)
  }

  async function share(data: ShareData) {
    try {
      await navigator.share(data)
    } catch {
      // Dismissed by the visitor, or refused by the browser: nothing to report.
    }
  }

  async function copy(channel: 'copy' | 'instagram') {
    try {
      await navigator.clipboard.writeText(link(channel))
      show(channel === 'copy' ? 'copied' : 'instagram', 4000)
    } catch {
      // No clipboard access (insecure context, permissions): the other buttons remain.
    }
  }

  function shareToInstagram(file: File) {
    // Both start within the tap: the copy is not awaited, so the share sheet can still open.
    navigator.clipboard
      .writeText(link('instagram'))
      .then(() => show('instagramStory', 15000))
      .catch(() => undefined)
    // The picture alone, which Instagram opens as a new story or post.
    void share({ files: [file] })
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
        {canShareLink && (
          <Button
            type="button"
            className={buttonClass}
            onClick={() => share({ title, text, url: link('native') })}
          >
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
        {visualFile ? (
          <Button
            type="button"
            variant="outline"
            className={buttonClass}
            onClick={() => shareToInstagram(visualFile)}
          >
            <NetworkIcon platform="instagram" className="size-5" />
            Instagram
          </Button>
        ) : (
          // A link, so Instagram opens within the tap; the copy runs alongside.
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
        )}
        <Button
          type="button"
          variant="outline"
          className={buttonClass}
          onClick={() => copy('copy')}
        >
          {notice === 'copied' ? <Check aria-hidden /> : <Link2 aria-hidden />}
          {notice === 'copied' ? t('copied') : t('copy')}
        </Button>
      </div>
      {/* Read out after every copy; shown for Instagram, where the next step is not obvious. */}
      <p
        aria-live="polite"
        className={cn(
          'text-small text-muted-foreground',
          (notice === null || notice === 'copied') && 'sr-only',
        )}
      >
        {notice && t(noticeMessages[notice])}
      </p>
    </div>
  )
}
