import type { DefaultServerCellComponentProps } from 'payload'

import type { Ticket } from '@/payload-types'

/**
 * Receipt thumbnail in the participations list: the small `thumbnail` size, not the full photo.
 * Clicking it opens the full photo in a new tab. Both are served by Payload at /api/tickets/file/*,
 * which only answers logged-in staff, so neither becomes a public URL.
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
  if (!ticket?.url || !src) return null

  return (
    <a
      href={ticket.url}
      target="_blank"
      rel="noopener noreferrer"
      title={ticket.filename ?? undefined}
    >
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
