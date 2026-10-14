'use client'

import { useDocumentInfo, useFormFields, useTranslation } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { drawErrorMessage, drawMessages } from './drawMessages'

const style = {
  box: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBlock: '1rem' },
  error: { color: 'var(--theme-error-500)' },
} as const

/**
 * On a winner's page: voids the winner with a reason and draws a replacement through
 * POST /api/winners/:id/redraw, then opens the new winner. Hidden once the winner is voided.
 */
export function RedrawField() {
  const { i18n } = useTranslation()
  const t = drawMessages(i18n.language)
  const { id } = useDocumentInfo()
  const voided = useFormFields(([fields]) => fields.voided?.value === true)
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!id || voided) return null

  async function redraw() {
    if (!reason.trim()) {
      setError(t.errors['reason-required'])
      return
    }
    if (!window.confirm(t.confirmRedraw)) return

    setPending(true)
    setError(null)
    try {
      const response = await fetch(`/api/winners/${id}/redraw`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(drawErrorMessage(t, result.code))
        return
      }
      router.push(`/admin/collections/winners/${result.winnerIds[0]}`)
    } catch {
      setError(t.failed)
    } finally {
      setPending(false)
    }
  }

  return (
    <div style={style.box}>
      <strong>{t.redrawTitle}</strong>
      <span>{t.redrawHelp}</span>
      <label htmlFor="redraw-reason">{t.reason}</label>
      <textarea
        id="redraw-reason"
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <div>
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          onClick={redraw}
          disabled={pending}
        >
          {t.redraw}
        </button>
      </div>
      {error && (
        <span role="alert" style={style.error}>
          {error}
        </span>
      )}
    </div>
  )
}
