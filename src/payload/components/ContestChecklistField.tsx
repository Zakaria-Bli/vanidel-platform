'use client'

import { useDocumentInfo, useTranslation } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import type { ChecklistItem } from '@/modules/contests/domain/checklist'

import { checklistMessages } from './checklistMessages'

const style = {
  box: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    padding: '0.75rem 1rem',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: '4px',
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  item: { display: 'flex', gap: '0.5rem', alignItems: 'baseline' },
  ok: { color: 'var(--theme-success-500)' },
  required: { color: 'var(--theme-error-500)' },
  recommended: { color: 'var(--theme-warning-500)' },
  muted: { color: 'var(--theme-elevation-500)', fontSize: '0.85em' },
} as const

/**
 * In the contest sidebar: what is still missing before publishing, refreshed after each save.
 * Missing translations are named field by field, e.g. `title (ar)`.
 */
export function ContestChecklistField() {
  const { i18n } = useTranslation()
  const t = checklistMessages(i18n.language)
  const { id, lastUpdateTime } = useDocumentInfo()
  const [items, setItems] = useState<ChecklistItem[] | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetch(`/api/contests/${id}/checklist`, { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((result: { items: ChecklistItem[] } | null) => {
        if (!cancelled && result) setItems(result.items)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [id, lastUpdateTime])

  const describe = (item: ChecklistItem) =>
    item.id === 'translations'
      ? item.missing.join(', ')
      : item.missing
          .map((value) => t.missing[value])
          .filter(Boolean)
          .join(', ')

  return (
    <div style={style.box}>
      <strong>{t.title}</strong>
      {!id && <span style={style.muted}>{t.saveFirst}</span>}
      {items && items.every(({ ok }) => ok) && <span style={style.ok}>✓ {t.ready}</span>}
      {items && (
        <ul style={style.list}>
          {items.map((item) => (
            <li key={item.id} style={style.item}>
              <span aria-hidden style={item.ok ? style.ok : style[item.level]}>
                {item.ok ? '✓' : item.level === 'required' ? '✗' : '!'}
              </span>
              <span>
                {t.items[item.id]}
                {!item.ok && item.level === 'required' && (
                  <span style={style.required}> ({t.required})</span>
                )}
                {!item.ok && describe(item) && (
                  <span style={{ ...style.muted, display: 'block' }}>{describe(item)}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {id && <span style={style.muted}>{t.help}</span>}
    </div>
  )
}
