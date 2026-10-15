'use client'

import { Check, ImageDown, Link2, MessageCircle, Share2, ThumbsUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useSyncExternalStore } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { contestShareUrl, networkShareUrl } from '@/modules/analytics/domain/share'
import { cn } from '@/lib/utils'

export interface ShareButtonsProps {
  siteUrl: string
  slug: string
  title: string
  /** The contest's ready-made visual (share image, else hero), offered to save or post as is. */
  visual?: { url: string; filename: string } | null
  className?: string
}

const buttonClass = 'px-4'

const outlineLink = buttonVariants({ variant: 'outline', className: buttonClass })

const noSubscription = () => () => {}
const hasShareSheet = () => typeof navigator.share === 'function'

/**
 * Share actions (SPECIFICATION §16–17): the device share sheet where there is one (mobile),
 * WhatsApp, Facebook and copying the link everywhere, and the visual for Instagram or TikTok,
 * which take an image rather than a link. Each link is tagged with the channel it went out on.
 */
export function ShareButtons({ siteUrl, slug, title, visual, className }: ShareButtonsProps) {
  const t = useTranslations('share')
  const link = (channel: Parameters<typeof contestShareUrl>[2]) =>
    contestShareUrl(siteUrl, slug, channel)
  const text = t('text', { title })

  // Known only in the browser; the server renders the buttons every device has.
  const canShareLink = useSyncExternalStore(noSubscription, hasShareSheet, () => false)
  const [visualFile, setVisualFile] = useState<File | null>(null)
  const [copied, setCopied] = useState(false)

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

  async function share(data: ShareData) {
    try {
      await navigator.share(data)
    } catch {
      // Dismissed by the visitor, or refused by the browser: nothing to report.
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link('copy'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // No clipboard access (insecure context, permissions): the other buttons remain.
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
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
        href={networkShareUrl('whatsapp', link('whatsapp'), text)}
        target="_blank"
        rel="noopener noreferrer"
        className={outlineLink}
      >
        <MessageCircle aria-hidden />
        WhatsApp
      </a>
      <a
        href={networkShareUrl('facebook', link('facebook'), text)}
        target="_blank"
        rel="noopener noreferrer"
        className={outlineLink}
      >
        <ThumbsUp aria-hidden />
        Facebook
      </a>
      <Button type="button" variant="outline" className={buttonClass} onClick={copy}>
        {copied ? <Check aria-hidden /> : <Link2 aria-hidden />}
        <span aria-live="polite">{copied ? t('copied') : t('copy')}</span>
      </Button>
      {visual &&
        (visualFile ? (
          <Button
            type="button"
            variant="outline"
            className={buttonClass}
            onClick={() => share({ files: [visualFile], text: `${text} ${link('native')}` })}
          >
            <ImageDown aria-hidden />
            {t('visualShare')}
          </Button>
        ) : (
          <a href={visual.url} download={visual.filename} className={outlineLink}>
            <ImageDown aria-hidden />
            {t('visualSave')}
          </a>
        ))}
    </div>
  )
}
