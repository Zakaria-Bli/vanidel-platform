'use client'

import { useField, useTranslation } from '@payloadcms/ui'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

import { reportMessages } from './reportMessages'

const style = {
  box: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBlock: '1rem' },
  url: {
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: '4px',
    wordBreak: 'break-all',
    direction: 'ltr',
    fontFamily: 'monospace',
  },
  actions: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  qr: { width: '160px', height: '160px', background: '#fff', padding: '8px' },
} as const

// High error correction: a printed code stays readable when scuffed or partly covered.
const qrOptions = { errorCorrectionLevel: 'H', margin: 2 } as const

function download(href: string, filename: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.click()
}

/**
 * On a campaign link's page: its tagged address, to copy, and its QR code to download as PNG for
 * screens or SVG for print. The address comes from the saved link.
 */
export function CampaignLinkField({ path }: { path: string }) {
  const { i18n } = useTranslation()
  const t = reportMessages(i18n.language).link
  const { value } = useField<string | null>({ path })
  const [preview, setPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!value) return
    let cancelled = false
    QRCode.toDataURL(value, { ...qrOptions, width: 320 })
      .then((url) => !cancelled && setPreview(url))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [value])

  if (!value) return <p>{t.saveFirst}</p>

  const params = new URL(value).searchParams
  // E.g. qr-influencer-sarah
  const filename = ['qr', ...['utm_source', 'utm_content'].map((p) => params.get(p))]
    .filter(Boolean)
    .join('-')

  async function copy() {
    await navigator.clipboard.writeText(value!)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={style.box}>
      <div style={style.url}>{value}</div>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- a generated data URL
        <img src={preview} alt="" style={style.qr} />
      )}
      <div style={style.actions}>
        <button type="button" className="btn btn--style-secondary btn--size-small" onClick={copy}>
          {copied ? t.copied : t.copy}
        </button>
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          onClick={async () =>
            download(
              await QRCode.toDataURL(value, { ...qrOptions, width: 1200 }),
              `${filename}.png`,
            )
          }
        >
          {t.png}
        </button>
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          onClick={async () => {
            const svg = await QRCode.toString(value, { ...qrOptions, type: 'svg' })
            const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
            download(url, `${filename}.svg`)
            setTimeout(() => URL.revokeObjectURL(url), 1000)
          }}
        >
          {t.svg}
        </button>
      </div>
    </div>
  )
}
