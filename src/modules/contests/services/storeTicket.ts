import { createHash, randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { createLocalReq, type Payload, type PayloadRequest } from 'payload'
import sharp from 'sharp'

import type { Ticket } from '@/payload-types'
import { ticketThumbnail } from '@/payload/collections/Tickets'

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

export interface PreparedTicket {
  /** Normalized JPEG bytes, as stored. */
  image: Buffer
  /** SHA-256 of `image`: the duplicate-receipt key within a contest. */
  hash: string
}

/** Normalizes and hashes a receipt photo. CPU-bound; do it before opening a transaction. */
export async function prepareTicket(data: Buffer): Promise<PreparedTicket> {
  const image = await normalizeTicketImage(data)
  return { image, hash: sha256(image) }
}

/**
 * Stores a participant's receipt photo for a contest and returns the ticket. The hash is taken
 * from the stored (normalized) bytes, so the same photo sent twice to a contest is refused with
 * `duplicate` (SPECIFICATION §8.1); the unique (contest, hash) index backs this up. Pass the
 * submission's `req` to keep it in the same transaction.
 */
export async function storeTicket(
  payload: Payload,
  {
    contestId,
    data,
    req,
  }: { contestId: number; data: Buffer | PreparedTicket; req?: Partial<PayloadRequest> },
): Promise<Ticket> {
  const { image, hash } = Buffer.isBuffer(data) ? await prepareTicket(data) : data

  const { totalDocs } = await payload.count({
    collection: 'tickets',
    where: { contest: { equals: contestId }, hash: { equals: hash } },
    req,
  })
  if (totalDocs > 0) throw new TicketRejectedError('duplicate')

  // Unique per upload: the contest ID keeps contests apart, and the random part keeps two
  // concurrent uploads from choosing the same name. Payload can only check names already
  // committed (and, on local disk, files already written), and with object storage two
  // transactions in flight would both pick `{hash}.jpg` and collide on the unique filename
  // index. Duplicates are detected by (contest, hash), not by name.
  const filename = `${contestId}-${hash}-${randomUUID().slice(0, 8)}.jpg`
  try {
    return await payload.create({
      collection: 'tickets',
      data: { contest: contestId, hash, uploadedAt: new Date().toISOString() },
      file: { data: image, mimetype: 'image/jpeg', name: filename, size: image.length },
      overrideAccess: true,
      req,
    })
  } catch (error) {
    // On local disk Payload writes the file before inserting the record, so a failed insert
    // would leave it behind. The name is unique to this attempt, so removing it is safe.
    await removeTicketFiles(payload, { filename }, req)
    throw error
  }
}

/**
 * Deletes a ticket's stored files (photo and thumbnail) whose record does not exist: its creation failed, or the
 * transaction that created it was rolled back. Runs the same delete path as deleting a record:
 * local disk, or the storage plugin's afterDelete hook for the bucket.
 */
export async function removeTicketFiles(
  payload: Payload,
  ticket: Pick<Ticket, 'filename'> & Partial<Ticket>,
  req?: Partial<PayloadRequest>,
): Promise<void> {
  if (!ticket.filename) return
  const { config } = payload.collections.tickets
  // A failed create leaves no record to read the thumbnail's name from, so derive it the way
  // Payload names image sizes: `{name}-{width}x{height}.{extension}`.
  const { size, extension } = ticketThumbnail
  const thumbnail = `${path.parse(ticket.filename).name}-${size}x${size}.${extension}`
  const doc = {
    ...ticket,
    sizes: ticket.sizes ?? { [ticketThumbnail.name]: { filename: thumbnail } },
  }
  if (!config.upload.disableLocalStorage) {
    const dir = config.upload.staticDir ?? 'tickets'
    await rm(path.resolve(dir, ticket.filename), { force: true })
    await rm(path.resolve(dir, thumbnail), { force: true })
  }
  const request = (req?.payload ? req : await createLocalReq({}, payload)) as PayloadRequest
  for (const hook of config.hooks.afterDelete ?? []) {
    await hook({ collection: config, context: {}, doc, id: ticket.id ?? 0, req: request })
  }
}
