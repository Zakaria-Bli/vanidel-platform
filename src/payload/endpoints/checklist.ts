import type { Endpoint } from 'payload'

import { locales } from '@/i18n/config'
import { publicationChecklist } from '@/modules/contests/domain/checklist'

import { hasRole } from '../access'

/** GET /api/contests/:id/checklist: what the contest still needs before going public, for staff. */
export const contestChecklistEndpoint: Omit<Endpoint, 'root'> = {
  path: '/:id/checklist',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req, 'admin', 'commercial')) {
      return Response.json({ errors: [{ message: 'Forbidden' }] }, { status: 403 })
    }
    const id = Number(req.routeParams?.id)
    const contest = Number.isInteger(id)
      ? await req.payload
          .findByID({ collection: 'contests', id, locale: 'all', depth: 0, req })
          .catch(() => null)
      : null
    if (!contest) return Response.json({ errors: [{ message: 'Not found' }] }, { status: 404 })
    return Response.json(
      { status: contest.status, items: publicationChecklist(contest, locales) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  },
}
