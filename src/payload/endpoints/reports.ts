import type { Endpoint } from 'payload'

import { csvResponse, toCsv, type CsvValue } from '@/lib/csv'
import { contestReport, type ContestReport } from '@/modules/analytics/queries/contestReport'
import { wilayas } from '@/modules/audience/domain/wilayas'
import { drawTimeZone } from '@/modules/contests/domain/drawPeriod'

import { hasRole } from '../access'

const algiersDay = new Intl.DateTimeFormat('sv-SE', { timeZone: drawTimeZone, dateStyle: 'short' })
const wilayaName = (code: string | null) => wilayas.find((wilaya) => wilaya.code === code)?.fr ?? ''

/** The report as one spreadsheet: a section column, then what each row counts. */
export function reportCsv(report: ContestReport): string {
  const rows: CsvValue[][] = [
    ['total', 'participations', '', '', report.totals.participations, report.totals.uniquePhones],
    ['total', 'marketing_opt_ins', '', '', report.totals.marketingOptIns, ''],
    ...report.channels.map((row) => [
      'channel',
      row.source ?? 'direct',
      row.medium ?? '',
      [row.content, ...row.links].filter(Boolean).join(' · '),
      row.participations,
      row.uniquePhones,
    ]),
    ...report.wilayas.map((row) => [
      'wilaya',
      row.code ?? '',
      wilayaName(row.code),
      '',
      row.participations,
      '',
    ]),
    ...report.periods.map((row) => [
      'period',
      algiersDay.format(new Date(row.periodStart)),
      '',
      '',
      row.participations,
      '',
    ]),
    ...Object.entries(report.draws).map(([name, value]) => ['draws', name, '', '', value, '']),
  ]
  return toCsv(['section', 'key', 'detail', 'link', 'participations', 'unique_phones'], rows)
}

/**
 * GET /api/contests/:id/report, or with ?format=csv as a download: the contest's campaign report
 * (SPECIFICATION §13.3), for staff.
 */
export const contestReportEndpoint: Omit<Endpoint, 'root'> = {
  path: '/:id/report',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req, 'admin', 'commercial')) {
      return Response.json({ errors: [{ message: 'Forbidden' }] }, { status: 403 })
    }
    const id = Number(req.routeParams?.id)
    const report = Number.isInteger(id) && id > 0 ? await contestReport(req.payload, id) : null
    if (!report) return Response.json({ errors: [{ message: 'Not found' }] }, { status: 404 })

    if (req.searchParams.get('format') === 'csv') {
      const day = new Date().toISOString().slice(0, 10)
      return csvResponse(reportCsv(report), `rapport-${report.contest.slug}-${day}.csv`)
    }
    return Response.json(report, { headers: { 'Cache-Control': 'no-store' } })
  },
}
