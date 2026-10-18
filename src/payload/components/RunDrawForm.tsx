'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { drawErrorMessage, type DrawMessages } from './drawMessages'

export interface PeriodOption {
  /** `{contestId}|{periodStart ISO}`. */
  value: string
  label: string
  drawn: boolean
}

const style = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    maxWidth: '40rem',
  },
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' },
  error: { color: 'var(--theme-error-500)' },
} as const

export function RunDrawForm({ options, t }: { options: PeriodOption[]; t: DrawMessages }) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!value || !window.confirm(t.confirmRun)) return
    const [contestId, periodStart] = value.split('|')

    setPending(true)
    setError(null)
    try {
      const response = await fetch('/api/draws/run', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contestId: Number(contestId), periodStart }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(drawErrorMessage(t, result.code))
        return
      }
      // Straight to who won, with their receipts a click away.
      router.push(
        `/admin/collections/winners?${new URLSearchParams({
          'where[draw][equals]': String(result.drawId),
          sort: 'rank',
        })}`,
      )
    } catch {
      setError(t.failed)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} style={style.form}>
      <strong>{t.title}</strong>
      <span>{t.help}</span>
      {options.length === 0 ? (
        <span>{t.noPeriod}</span>
      ) : (
        <div style={style.row}>
          <select
            aria-label={t.period}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          >
            <option value="">{t.choose}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.drawn}>
                {option.drawn ? `${option.label} · ${t.drawn}` : option.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="btn btn--style-primary btn--size-small"
            disabled={!value || pending}
          >
            {pending ? t.running : t.run}
          </button>
        </div>
      )}
      {error && (
        <span role="alert" style={style.error}>
          {error}
        </span>
      )}
    </form>
  )
}
