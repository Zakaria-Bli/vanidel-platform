import type { DefaultServerCellComponentProps } from 'payload'

import type { Ticket } from '@/payload-types'

/**
 * Receipt thumbnail in the participations list: the small `thumbnail` size, not the full photo.
 * Served by Payload at /api/tickets/file/*, which only answers logged-in staff, so it never
 * becomes a public URL.
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
  // Tickets stored before thumbnails existed fall back to the full photo.
  const src = ticket?.sizes?.thumbnail?.url ?? ticket?.url
  if (!ticket || !src) return null

  return (
    <a href={`/admin/collections/tickets/${ticket.id}`} title={ticket.filename ?? undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element -- authenticated admin file, not optimizable */}
      <img
        src={src}
        alt=""
        width={48}
        height={48}
        loading="lazy"
        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }}
      />
    </a>
  )
}
