'use client'

import { Camera, CircleCheck } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react'

import chefThumbsUp from '@/assets/brand/photos/vanidel-chef-thumbs-up.png'
import { trackParticipation } from '@/components/analytics/Tracking'
import { Button, buttonVariants } from '@/components/ui/button'
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
  consents: { type: string; required: boolean; label: string; textVersion: string }[]
  regulationUrl?: string
  /** Share buttons shown with the confirmation, so participants pass the contest on. */
  share?: ReactNode
  action: (state: ParticipationState, formData: FormData) => Promise<ParticipationState>
}

// Focus shows the site-wide outline (globals.css); fields stay 48 px tall for thumbs.
const inputClass =
  'h-12 w-full rounded-control border border-input bg-background px-4 text-body focus-visible:border-ring aria-invalid:border-destructive'

export function ParticipationForm({
  contestSlug,
  locale,
  email,
  wilayaRequired,
  consents,
  regulationUrl,
  share,
  action,
}: ParticipationFormProps) {
  const t = useTranslations('participation')
  const tShare = useTranslations('share')
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

  const confirmation = useRef<HTMLDivElement>(null)

  // Conversion for the pixels, if the visitor accepted them: the contest slug only. The
  // confirmation replaces a long form, so it is brought into view from the submit button.
  useEffect(() => {
    if (state.status !== 'success') return
    trackParticipation(contestSlug)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    confirmation.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    })
  }, [state, contestSlug])
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
      <div
        ref={confirmation}
        role="status"
        className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:gap-8 sm:text-start"
      >
        {/*
         * Stands on the card's bottom edge from tablets up. Never mirrored in Arabic: the logo on
         * his apron would read backwards.
         */}
        <div className="relative w-44 shrink-0 sm:-mb-8 sm:w-48">
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 aspect-square rounded-full bg-secondary"
          />
          <Image
            src={chefThumbsUp}
            alt={t('success.chef')}
            sizes="(min-width: 640px) 192px, 176px"
            className="relative w-full motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in motion-safe:zoom-in-90"
          />
        </div>
        <div className="flex flex-col items-center gap-3 sm:items-start sm:pb-2">
          <p className="flex items-center gap-2 text-label text-success">
            <CircleCheck aria-hidden className="size-6" />
            {t('success.badge')}
          </p>
          <h3>{t('success.title')}</h3>
          <p>{t('success.body')}</p>
          {share && (
            <div className="mt-3 flex w-full flex-col items-center gap-3 border-t pt-5 sm:items-start">
              <p className="text-label">{tShare('afterParticipation')}</p>
              {share}
            </div>
          )}
        </div>
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
      <p id={`${id}-${name}-error`} className="text-small font-medium text-destructive">
        {errorFor(name)}
      </p>
    )
  const label = (name: string, text: string, optional = false) => (
    <label htmlFor={`${id}-${name}`} className="text-label">
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
          className={cn(inputClass, 'text-left rtl:text-right')}
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
            className={cn(inputClass, 'text-left rtl:text-right')}
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
        <p id={`${id}-ticket-hint`} className="text-small text-muted-foreground">
          {t('fields.ticketHint')}
        </p>
        <TicketPicker
          {...field(fields.ticket)}
          describedBy={cn(`${id}-ticket-hint`, errorFor(fields.ticket) && `${id}-ticket-error`)}
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
                {/* Records which wording the visitor agreed to; refused if it has changed. */}
                <input
                  type="hidden"
                  name={`${fields.consentVersion}${consent.type}`}
                  value={consent.textVersion}
                />
                <div className="flex items-start gap-3">
                  <input
                    {...field(name)}
                    type="checkbox"
                    required={consent.required}
                    className="mt-1 size-5 shrink-0 accent-primary"
                  />
                  <label htmlFor={`${id}-${name}`} className="text-small">
                    {consent.label}
                    {consent.type === 'regulation' && regulationUrl && (
                      <>
                        {' '}
                        <a
                          href={regulationUrl}
                          target="_blank"
                          rel="noopener"
                          className="font-medium text-primary-ink underline underline-offset-4"
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
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-control bg-destructive/10 p-4 font-medium text-destructive"
        >
          <p>{generalError}</p>
          {shown.status === 'error' &&
            (shown.code === 'consents-changed' || shown.code === 'unexpected') && (
              <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                {t('reload')}
              </Button>
            )}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? t('sending') : t('submit')}
      </Button>
    </form>
  )
}

/**
 * The ticket photo field: the native input stays in the form, visually hidden but focusable, behind
 * a translated "Choisir une photo" button, the file name and a thumbnail. Browsers that cannot show
 * the photo (HEIC on most desktops) get a camera icon instead.
 */
function TicketPicker({
  id,
  name,
  describedBy,
  'aria-invalid': invalid,
}: {
  id: string
  name: string
  describedBy: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}) {
  const t = useTranslations('participation.file')
  const [photo, setPhoto] = useState<{ name: string; url: string } | null>(null)
  const [previewFailed, setPreviewFailed] = useState(false)

  // Each chosen photo's preview URL is released once replaced or when the form goes away.
  useEffect(() => {
    if (!photo) return
    return () => URL.revokeObjectURL(photo.url)
  }, [photo])

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    setPreviewFailed(false)
    setPhoto(file ? { name: file.name, url: URL.createObjectURL(file) } : null)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-card border-2 border-dashed border-input bg-background p-3',
        'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring',
        invalid && 'border-destructive',
      )}
    >
      <div className="flex-center size-16 shrink-0 overflow-hidden rounded-control bg-secondary text-primary-ink">
        {photo && !previewFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local file the visitor just chose
          <img
            src={photo.url}
            alt={t('preview')}
            className="size-full object-cover"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <Camera aria-hidden className="size-7" />
        )}
      </div>
      <div className="flex min-w-0 flex-col items-start gap-1">
        <label
          htmlFor={id}
          className={buttonVariants({
            variant: 'outline',
            size: 'sm',
            className: 'cursor-pointer',
          })}
        >
          {photo ? t('change') : t('choose')}
        </label>
        <p className="max-w-full truncate text-small text-muted-foreground" aria-live="polite">
          {photo?.name ?? t('none')}
        </p>
      </div>
      <input
        id={id}
        name={name}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        required
        onChange={onChange}
        className="sr-only"
      />
    </div>
  )
}
