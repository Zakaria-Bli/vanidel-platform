'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import {
  conversionPayloads,
  cookieConsentMaxAge,
  cookieConsentName,
  hasTracking,
  participationEvent,
  readCookieConsent,
  type CookieConsent,
  type TrackingIds,
} from '@/modules/analytics/domain/tracking'

/** Opens the cookie banner again, from the footer. */
export const cookieSettingsEvent = 'vanidel:cookie-settings'

type Gtag = (...args: unknown[]) => void
type Fbq = (...args: unknown[]) => void
declare global {
  interface Window {
    gtag?: Gtag
    fbq?: Fbq
  }
}

/**
 * Cookie banner and analytics (Meta Pixel, Google Analytics 4), public pages only. Nothing is
 * loaded before the visitor accepts, and nothing at all when no pixel ID is configured in the
 * settings. Only page views and the contest slug of a participation are sent, never form data.
 */
export function Tracking() {
  const t = useTranslations('cookies')
  const pathname = usePathname()
  const [ids, setIds] = useState<TrackingIds | null>(null)
  // Read once on the client; the server renders nothing that depends on it.
  const [consent, setConsent] = useState<CookieConsent | null>(() =>
    typeof document === 'undefined' ? null : readCookieConsent(document.cookie),
  )
  const [bannerOpen, setBannerOpen] = useState(false)

  useEffect(() => {
    const stored = readCookieConsent(document.cookie)
    fetch('/api/tracking')
      .then((response) => (response.ok ? response.json() : null))
      .then((loaded: TrackingIds | null) => {
        setIds(loaded)
        if (hasTracking(loaded) && !stored) setBannerOpen(true)
      })
      .catch(() => setIds(null))

    const reopen = () => setBannerOpen(true)
    window.addEventListener(cookieSettingsEvent, reopen)
    return () => window.removeEventListener(cookieSettingsEvent, reopen)
  }, [])

  // Lets bottom bars (the contest page's participate bar) step aside while the banner is up.
  useEffect(() => {
    if (!bannerOpen) return
    document.documentElement.dataset.cookieBanner = 'open'
    return () => {
      delete document.documentElement.dataset.cookieBanner
    }
  }, [bannerOpen])

  const active = consent === 'granted' && hasTracking(ids)

  // Page views on client-side navigation; the first one is sent when the scripts load.
  const [firstPath] = useState(pathname)
  useEffect(() => {
    if (!active || pathname === firstPath) return
    window.fbq?.('track', 'PageView')
    window.gtag?.('event', 'page_view', { page_path: pathname })
  }, [active, pathname, firstPath])

  useEffect(() => {
    if (!active) return
    const onParticipation = (event: Event) => {
      const { meta, ga4 } = conversionPayloads((event as CustomEvent<string>).detail)
      window.fbq?.(...meta)
      window.gtag?.(...ga4)
    }
    window.addEventListener(participationEvent, onParticipation)
    return () => window.removeEventListener(participationEvent, onParticipation)
  }, [active])

  function choose(choice: CookieConsent) {
    document.cookie = `${cookieConsentName}=${choice}; Max-Age=${cookieConsentMaxAge}; Path=/; SameSite=Lax`
    setConsent(choice)
    setBannerOpen(false)
    // Withdrawing consent cannot unload scripts already running; reload to stop them.
    if (choice === 'denied' && consent === 'granted') window.location.reload()
  }

  return (
    <>
      {active && ids?.metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(ids.metaPixelId)});fbq('track','PageView');`}
        </Script>
      )}
      {active && ids?.ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids.ga4Id)}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(ids.ga4Id)});`}
          </Script>
        </>
      )}
      {bannerOpen && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label={t('title')}
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-card border bg-background p-5 shadow-raised"
        >
          <p className="text-small">
            {t('text')}{' '}
            <Link href="/confidentialite" className="font-medium text-primary-ink underline">
              {t('privacy')}
            </Link>
          </p>
          <div className="flex gap-2">
            <Button onClick={() => choose('granted')}>{t('accept')}</Button>
            <Button variant="outline" onClick={() => choose('denied')}>
              {t('decline')}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

/** Footer button that reopens the cookie choice. */
export function CookieSettingsButton({ label, className }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(cookieSettingsEvent))}
    >
      {label}
    </button>
  )
}

/** Tells the analytics a participation was accepted (contest slug only). */
export function trackParticipation(contestSlug: string) {
  window.dispatchEvent(new CustomEvent(participationEvent, { detail: contestSlug }))
}
