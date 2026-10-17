import { describe, expect, it } from 'vitest'

import { CampaignLinks } from './collections/CampaignLinks'
import { ConsentRecords } from './collections/ConsentRecords'
import { Contacts } from './collections/Contacts'
import { Contests } from './collections/Contests'
import { Draws } from './collections/Draws'
import { Media } from './collections/Media'
import { Participations } from './collections/Participations'
import { Tickets } from './collections/Tickets'
import { Users } from './collections/Users'
import { Winners } from './collections/Winners'
import { Settings } from './globals/Settings'

const configs = [
  CampaignLinks,
  ConsentRecords,
  Contacts,
  Contests,
  Draws,
  Media,
  Participations,
  Tickets,
  Users,
  Winners,
  Settings,
]

describe('admin document views', () => {
  // Payload's "API" tab shows a document's raw JSON and REST URL: developer tooling the Vanidel
  // team has no use for. `hideAPIURL` removes the tab and its route.
  it.each(configs.map((config) => [config.slug, config] as const))(
    '%s hides the API tab',
    (_, config) => {
      expect(config.admin?.hideAPIURL).toBe(true)
    },
  )
})
