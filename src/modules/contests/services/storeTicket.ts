import { createHash } from 'node:crypto'
import type { Payload, PayloadRequest } from 'payload'
import sharp from 'sharp'

import type { Ticket } from '@/payload-types'

export const ticketLimits = {
  /** Upload size accepted from the phone, before re-encoding. */
  maxBytes: 10 * 1024 * 1024,
  /** Longest side kept; enough to read a receipt. */
  maxDimension: 2400,
  formats: ['jpeg', 'png', 'webp', 'heif'] as const,
}

export type TicketRejection = 'too-large' | 'unsupported-format' | 'duplicate'

export class TicketRejectedError extends Error {
  constructor(readonly reason: TicketRejection) {
    super(`Ticket rejected: ${reason}`)
    this.name = 'TicketRejectedError'
  }
}

/**
 * Normalizes a receipt photo: applies its EXIF orientation, drops all metadata (GPS position,
 * device), caps its size and re-encodes it as JPEG. The format is read from the bytes, never from
 * the client's file name or MIME type.
 */
export async function normalizeTicketImage(data: Buffer): Promise<Buffer> {
  if (data.length > ticketLimits.maxBytes) throw new TicketRejectedError('too-large')

  let format: string | undefined
  try {
    ;({ format } = await sharp(data).metadata())
  } catch {
    throw new TicketRejectedError('unsupported-format')
  }
  if (!format || !(ticketLimits.formats as readonly string[]).includes(format)) {
    throw new TicketRejectedError('unsupported-format')
  }

  try {
    return await sharp(data)
      .rotate()
      .resize({
        width: ticketLimits.maxDimension,
        height: ticketLimits.maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer()
  } catch {
    // Truncated files, or HEIC variants the bundled libvips cannot decode.
    throw new TicketRejectedError('unsupported-format')
  }
}

export function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Stores a participant's receipt photo for a contest and returns the ticket. The hash is taken
 * from the stored (normalized) bytes, so the same photo sent twice to a contest is refused with
 * `duplicate` (SPECIFICATION §8.1); the unique (contest, hash) index backs this up under
 * concurrent submissions. Pass the submission's `req` to keep it in the same transaction.
 */
export async function storeTicket(
  payload: Payload,
  { contestId, data, req }: { contestId: number; data: Buffer; req?: Partial<PayloadRequest> },
): Promise<Ticket> {
  const image = await normalizeTicketImage(data)
  const hash = sha256(image)

  const { totalDocs } = await payload.count({
    collection: 'tickets',
    where: { contest: { equals: contestId }, hash: { equals: hash } },
    req,
  })
  if (totalDocs > 0) throw new TicketRejectedError('duplicate')

  return payload.create({
    collection: 'tickets',
    data: { contest: contestId, hash, uploadedAt: new Date().toISOString() },
    file: { data: image, mimetype: 'image/jpeg', name: `${hash}.jpg`, size: image.length },
    overrideAccess: true,
    req,
  })
}
