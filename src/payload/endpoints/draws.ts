import type { Endpoint, PayloadRequest } from 'payload'

import { DrawError, executeDraw, voidAndRedraw } from '@/modules/contests/services/draws'
import type { User } from '@/payload-types'

import { hasRole } from '../access'

const forbidden = () => Response.json({ errors: [{ message: 'Forbidden' }] }, { status: 403 })
const invalid = () => Response.json({ errors: [{ message: 'Invalid request' }] }, { status: 400 })

async function body(req: PayloadRequest): Promise<Record<string, unknown> | null> {
  try {
    const data: unknown = await req.json?.()
    return typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** Runs a service call and maps a `DrawError` to a 409 carrying its code for the admin panel. */
async function respond(run: () => Promise<{ drawId: number; winnerIds: number[] }>) {
  try {
    return Response.json(await run(), { status: 201 })
  } catch (error) {
    if (error instanceof DrawError) {
      return Response.json(
        { code: error.code, errors: [{ message: error.message }] },
        { status: 409 },
      )
    }
    throw error
  }
}

/** POST /api/draws/run `{ contestId, periodStart }`: draws one ended period of a contest. */
export const runDraw: Omit<Endpoint, 'root'> = {
  path: '/run',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req, 'admin', 'commercial')) return forbidden()

    const data = await body(req)
    const contestId = Number(data?.contestId)
    const periodStart = new Date(String(data?.periodStart))
    if (!Number.isInteger(contestId) || contestId < 1 || Number.isNaN(periodStart.getTime())) {
      return invalid()
    }

    return respond(() =>
      executeDraw(req.payload, { contestId, periodStart, user: req.user as User }),
    )
  },
}

/** POST /api/winners/:id/redraw `{ reason }`: voids the winner and draws a replacement. */
export const redrawWinner: Omit<Endpoint, 'root'> = {
  path: '/:id/redraw',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req, 'admin', 'commercial')) return forbidden()

    const winnerId = Number(req.routeParams?.id)
    const data = await body(req)
    if (!Number.isInteger(winnerId) || winnerId < 1 || typeof data?.reason !== 'string') {
      return invalid()
    }

    return respond(() =>
      voidAndRedraw(req.payload, {
        winnerId,
        reason: data.reason as string,
        user: req.user as User,
      }),
    )
  },
}
