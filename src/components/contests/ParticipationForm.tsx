'use client'

import { CircleCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { startTransition, useActionState, useId, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/config'
import { resizeForUpload } from '@/lib/images/resizeForUpload'
import { wilayaLabel, wilayas } from '@/modules/audience/domain/wilayas'
import { cn } from '@/lib/utils'

import {
  initialParticipationState,
  participationFields as fields,
  type ParticipationState,
} from './participationState'

/** Original photos above this are refused before upload unless the browser could shrink them. */
const maxOriginalBytes = 10 * 1024 * 1024

export interface ParticipationFormProps {
  contestSlug: string
  locale: Locale
  email: 'off' | 'optional' | 'required'
  wilayaRequired: boolean
  consents: { type: string; required: boolean; label: string }[]
  regulationUrl?: string
  action: (state: ParticipationState, formData: FormData) => Promise<ParticipationState>
}

const inputClass =
  'h-12 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'

export function ParticipationForm({
  contestSlug,
  locale,
  email,
  wilayaRequired,
  consents,
  regulationUrl,
  action,
}: ParticipationFormProps) {
  const t = useTranslations('participation')
  const id = useId()
  // A failed call (network loss, or a page left open across a deploy) shows a message rather
  // than the error page.
  const [state, dispatch, pending] = useActionState(
    async (previous: ParticipationState, formData: FormData): Promise<ParticipationState> => {
      try {
        return await action(previous, formData)
      } catch {
        return { status: 'error', code: 'unexpected' }
      }
    },
    initialParticipationState,
  )
  // Problems found before sending (photo too large), shown like server errors.
  const [localError, setLocalError] = useState<ParticipationState | null>(null)
  const [preparing, setPreparing] = useState(false)
  const shown = localError ?? state
  const busy = pending || preparing

  const errorFor = (field: string) =>
    shown.status === 'error' && shown.field === field ? t(`errors.${shown.code}`) : undefined
  const generalError =
    shown.status === 'error' && !shown.field ? t(`errors.${shown.code}`) : undefined

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError(null)
    const formData = new FormData(event.currentTarget)
    const photo = formData.get(fields.ticket)

    if (photo instanceof File && photo.size > 0) {
      setPreparing(true)
      const resized = await resizeForUpload(photo)
      setPreparing(false)
      if (resized.size > maxOriginalBytes) {
        setLocalError({ status: 'error', code: 'ticket-too-large', field: fields.ticket })
        return
      }
      formData.set(fields.ticket, resized)
    }
    startTransition(() => dispatch(formData))
  }

  if (shown.status === 'success') {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-xl bg-secondary p-5">
        <CircleCheck aria-hidden className="size-8 text-success" />
        <h3>{t('success.title')}</h3>
        <p>{t('success.body')}</p>
      </div>
    )
  }

  const field = (name: string) => ({
    id: `${id}-${name}`,
    name,
    'aria-invalid': errorFor(name) ? true : undefined,
    'aria-describedby': errorFor(name) ? `${id}-${name}-error` : undefined,
  })
  const error = (name: string) =>
    errorFor(name) && (
      <p id={`${id}-${name}-error`} className="text-sm font-medium text-destructive">
        {errorFor(name)}
      </p>
    )
  const label = (name: string, text: string, optional = false) => (
    <label htmlFor={`${id}-${name}`} className="font-medium">
      {text}
      {optional && <span className="font-normal text-muted-foreground"> {t('optional')}</span>}
    </label>
  )

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <input type="hidden" name={fields.contest} value={contestSlug} />
      <input type="hidden" name={fields.locale} value={locale} />
      {/* Honeypot: invisible, and skipped by keyboard and screen readers. */}
      <div aria-hidden className="sr-only">
        <label htmlFor={`${id}-${fields.honeypot}`}>Website</label>
        <input
          id={`${id}-${fields.honeypot}`}
          name={fields.honeypot}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-2">
        {label(fields.name, t('fields.name'))}
        <input
          {...field(fields.name)}
          className={inputClass}
          autoComplete="name"
          required
          maxLength={100}
        />
        {error(fields.name)}
      </div>

      <div className="flex flex-col gap-2">
        {label(fields.phone, t('fields.phone'))}
        <input
          {...field(fields.phone)}
          className={cn(inputClass, 'text-start')}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          placeholder="05 55 12 34 56"
          required
        />
        {error(fields.phone)}
      </div>

      {email !== 'off' && (
        <div className="flex flex-col gap-2">
          {label(fields.email, t('fields.email'), email === 'optional')}
          <input
            {...field(fields.email)}
            className={cn(inputClass, 'text-start')}
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            required={email === 'required'}
            maxLength={254}
          />
          {error(fields.email)}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {label(fields.wilaya, t('fields.wilaya'), !wilayaRequired)}
        <select
          {...field(fields.wilaya)}
          className={inputClass}
          required={wilayaRequired}
          defaultValue=""
        >
          <option value="">{t('fields.wilayaPlaceholder')}</option>
          {wilayas.map((wilaya) => (
            <option key={wilaya.code} value={wilaya.code}>
              {wilayaLabel(wilaya, locale)}
            </option>
          ))}
        </select>
        {error(fields.wilaya)}
      </div>

      <div className="flex flex-col gap-2">
        {label(fields.ticket, t('fields.ticket'))}
        <p id={`${id}-ticket-hint`} className="text-sm text-muted-foreground">
          {t('fields.ticketHint')}
        </p>
        <input
          {...field(fields.ticket)}
          aria-describedby={cn(
            `${id}-ticket-hint`,
            errorFor(fields.ticket) && `${id}-ticket-error`,
          )}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          required
          className="w-full rounded-lg border border-dashed border-input p-3 text-sm file:me-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:font-medium"
        />
        {error(fields.ticket)}
      </div>

      {consents.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">{t('consentsLegend')}</legend>
          {consents.map((consent) => {
            const name = `${fields.consent}${consent.type}`
            return (
              <div key={consent.type} className="flex flex-col gap-1">
                <div className="flex items-start gap-3">
                  <input
                    {...field(name)}
                    type="checkbox"
                    required={consent.required}
                    className="mt-1 size-5 shrink-0 accent-primary"
                  />
                  <label htmlFor={`${id}-${name}`} className="text-sm leading-relaxed">
                    {consent.label}
                    {consent.type === 'regulation' && regulationUrl && (
                      <>
                        {' '}
                        <a
                          href={regulationUrl}
                          target="_blank"
                          rel="noopener"
                          className="font-medium text-primary-hover underline underline-offset-4"
                        >
                          {t('readRules')}
                        </a>
                      </>
                    )}
                    {!consent.required && (
                      <span className="text-muted-foreground"> {t('optional')}</span>
                    )}
                  </label>
                </div>
                {error(name)}
              </div>
            )
          })}
        </fieldset>
      )}

      {generalError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 font-medium text-destructive">
          {generalError}
        </p>
      )}

      <Button type="submit" size="lg" className="h-12 text-base" disabled={busy}>
        {busy ? t('sending') : t('submit')}
      </Button>
    </form>
  )
}
