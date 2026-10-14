/** Cache tags for public contest data; Payload hooks revalidate them when content changes. */
export const cacheTags = {
  /** Every public contest read: lists, pages, and the media they embed. */
  contests: 'contests',
  contest: (slug: string) => `contest:${slug}`,
  /** Published winners, shown on contest pages and in the archive. */
  winners: 'winners',
  settings: 'settings',
} as const
