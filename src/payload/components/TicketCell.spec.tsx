import type { DefaultServerCellComponentProps } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { TicketCell } from './TicketCell'

const full = '/api/tickets/file/receipt.jpg'
const thumbnail = '/api/tickets/file/receipt-160x160.jpg'

const render = async (cellData: unknown, stored: unknown = null) => {
  const findByID = vi.fn().mockResolvedValue(stored)
  const html = renderToStaticMarkup(
    await TicketCell({
      cellData,
      payload: { findByID },
    } as unknown as DefaultServerCellComponentProps),
  )
  return { html, findByID }
}

describe('TicketCell', () => {
  it('shows the thumbnail and opens the full photo in a new tab', async () => {
    const { html } = await render({
      id: 1,
      url: full,
      filename: 'receipt.jpg',
      sizes: { thumbnail: { url: thumbnail } },
    })
    expect(html).toContain(`href="${full}"`)
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain(`src="${thumbnail}"`)
    expect(html).not.toContain('/admin/collections/tickets')
  })

  it('falls back to the full photo when there is no thumbnail', async () => {
    const { html } = await render({ id: 1, url: full })
    expect(html).toContain(`src="${full}"`)
  })

  it('loads the ticket when only its id is stored', async () => {
    const { html, findByID } = await render(7, { id: 7, url: full })
    expect(findByID).toHaveBeenCalledWith({ collection: 'tickets', id: 7, depth: 0 })
    expect(html).toContain(`href="${full}"`)
  })

  it('shows nothing without a ticket file', async () => {
    expect((await render(null)).html).toBe('')
    expect((await render({ id: 1 })).html).toBe('')
  })
})
