'use client'

import { useDocumentInfo, useTranslation } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import type { ContestReport } from '@/modules/analytics/queries/contestReport'
import { wilayas } from '@/modules/audience/domain/wilayas'
import { drawTimeZone } from '@/modules/contests/domain/drawPeriod'

import { reportMessages } from './reportMessages'

const style = {
  box: { display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBlock: '1rem' },
  totals: { display: 'flex', flexWrap: 'wrap', gap: '1rem' },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '9rem',
    padding: '0.75rem 1rem',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: '4px',
  },
  figure: { fontSize: '1.75rem', fontWeight: 600 },
  table: { width: '100%', borderCollapse: 'collapse' },
  cell: {
    padding: '0.35rem 0.5rem',
    borderBottom: '1px solid var(--theme-elevation-100)',
    textAlign: 'start',
  },
  number: {
    padding: '0.35rem 0.5rem',
    borderBottom: '1px solid var(--theme-elevation-100)',
    textAlign: 'end',
    fontVariantNumeric: 'tabular-nums',
  },
  muted: { color: 'var(--theme-elevation-500)' },
} as const

const dateFormat = (language: string) =>
  new Intl.DateTimeFormat(language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-GB' : 'fr-FR', {
    timeZone: drawTimeZone,
    dateStyle: 'medium',
  })

/** The contest report tab: entries by channel, wilaya and period, and the draws. */
export function ContestReportField() {
  const { i18n } = useTranslation()
  const t = reportMessages(i18n.language).report
  const { id } = useDocumentInfo()
  const [report, setReport] = useState<ContestReport | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetch(`/api/contests/${id}/report`, { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then((loaded: ContestReport) => !cancelled && setReport(loaded))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [id])

  if (!id) return <p>{t.saveFirst}</p>
  if (failed) return <p role="alert">{t.failed}</p>
  if (!report) return <p>{t.loading}</p>

  const total = report.totals.participations
  const share = (count: number) => (total ? `${Math.round((count / total) * 100)} %` : '')
  const wilayaName = (code: string | null) => {
    const wilaya = wilayas.find((entry) => entry.code === code)
    if (!wilaya) return t.unknownWilaya
    return `${wilaya.code} - ${i18n.language === 'ar' ? wilaya.ar : wilaya.fr}`
  }
  const day = dateFormat(i18n.language)

  return (
    <div style={style.box}>
      <div style={style.totals}>
        {(
          [
            [t.participations, report.totals.participations],
            [t.uniquePhones, report.totals.uniquePhones],
            [t.marketingOptIns, report.totals.marketingOptIns],
            [t.winners, report.draws.winners],
          ] as const
        ).map(([name, value]) => (
          <div key={name} style={style.tile}>
            <span style={style.muted}>{name}</span>
            <span style={style.figure}>{value}</span>
          </div>
        ))}
      </div>
      <div>
        <a
          href={`/api/contests/${id}/report?format=csv`}
          className="btn btn--style-secondary btn--size-small"
        >
          {t.csv}
        </a>
      </div>
      <p style={style.muted}>{t.visits}</p>

      <section>
        <h3>{t.channels}</h3>
        <table style={style.table}>
          <thead>
            <tr>
              <th style={style.cell}>{t.channel}</th>
              <th style={style.cell}>{t.medium}</th>
              <th style={style.cell}>{t.detail}</th>
              <th style={style.number}>{t.participations}</th>
              <th style={style.number}>{t.uniquePhones}</th>
              <th style={style.number}>%</th>
            </tr>
          </thead>
          <tbody>
            {report.channels.map((row) => (
              <tr key={`${row.source}|${row.medium}|${row.content}`}>
                <td style={style.cell}>{row.source ?? t.direct}</td>
                <td style={style.cell}>{row.medium}</td>
                <td style={style.cell}>
                  {[row.content, ...row.links].filter(Boolean).join(' · ')}
                </td>
                <td style={style.number}>{row.participations}</td>
                <td style={style.number}>{row.uniquePhones}</td>
                <td style={style.number}>{share(row.participations)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {total === 0 && <p style={style.muted}>{t.none}</p>}
      </section>

      {report.wilayas.length > 0 && (
        <section>
          <h3>{t.wilayas}</h3>
          <table style={style.table}>
            <tbody>
              {report.wilayas.map((row) => (
                <tr key={row.code ?? 'none'}>
                  <td style={style.cell}>{wilayaName(row.code)}</td>
                  <td style={style.number}>{row.participations}</td>
                  <td style={style.number}>{share(row.participations)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {report.periods.length > 0 && (
        <section>
          <h3>{t.periods}</h3>
          <table style={style.table}>
            <tbody>
              {report.periods.map((row) => (
                <tr key={row.periodStart}>
                  <td style={style.cell}>
                    {t.period} {day.format(new Date(row.periodStart))}
                  </td>
                  <td style={style.number}>{row.participations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h3>{t.draws}</h3>
        <table style={style.table}>
          <tbody>
            {(
              [
                [t.drawCount, report.draws.draws],
                [t.redraws, report.draws.redraws],
                [t.winners, report.draws.winners],
                [t.published, report.draws.published],
                [t.voided, report.draws.voided],
              ] as const
            ).map(([name, value]) => (
              <tr key={name}>
                <td style={style.cell}>{name}</td>
                <td style={style.number}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
