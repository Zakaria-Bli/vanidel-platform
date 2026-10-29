import { APIError, type PayloadRequest } from 'payload'

/**
 * Removing a participation, to the trash (commercial or admin) or for good (admin only), is refused
 * once a draw selected it: the draw's audit record and its winner point at it (SPECIFICATION
 * §10.2). Such a winner is voided and re-drawn instead.
 */
export class ParticipationDrawnError extends APIError {
  constructor() {
    super(
      'Cette participation a été tirée au sort : annulez le gagnant et relancez le tirage au lieu de la supprimer. / ' +
        'This participation was drawn: void the winner and re-draw instead of deleting it.',
      409,
      undefined,
      true,
    )
    this.name = 'ParticipationDrawnError'
  }
}

/** Throws ParticipationDrawnError when any winner, voided or not, points at the participation. */
export async function assertParticipationRemovable(
  req: PayloadRequest,
  participationId: number | string,
): Promise<void> {
  const { totalDocs } = await req.payload.count({
    collection: 'winners',
    where: { participation: { equals: participationId } },
    req,
  })
  if (totalDocs > 0) throw new ParticipationDrawnError()
}
