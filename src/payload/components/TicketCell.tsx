import type { DefaultServerCellComponentProps } from 'payload'

import type { Ticket } from '@/payload-types'

/**
 * Receipt thumbnail in the participations list. The image is served by Payload at
 * /api/tickets/file/*, which only answers logged-in staff, so it never becomes a public URL.
 */
export async function TicketCell({ cellData, payload }: DefaultServerCellComponentProps) {
  const ticket: Ticket | null =
    typeof cellData === 'object' && cellData !== null
      ? (cellData as Ticket)
      : typeof cellData === 'number' || typeof cellData === 'string'
        ? await payload
            .findByID({ collection: 'tickets', id: cellData, depth: 0 })
            .catch(() => null)
        : null
  if (!ticket?.url) return null

  return (
    <a href={`/admin/collections/tickets/${ticket.id}`} title={ticket.filename ?? undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element -- authenticated admin file, not optimizable */}
      <img
        src={ticket.url}
        alt=""
        width={48}
        height={48}
        loading="lazy"
        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }}
      />
    </a>
  )
}
