import type { CollectionConfig, Field, GlobalConfig } from 'payload'
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

const languages = ['fr', 'en', 'ar'] as const

/** Every admin text as [where, value], from config objects, fields, tabs and options. */
function texts(config: CollectionConfig | GlobalConfig): [string, unknown][] {
  const found: [string, unknown][] = []
  const add = (where: string, value: unknown) => found.push([`${config.slug} › ${where}`, value])

  if ('labels' in config) {
    add('labels.singular', config.labels?.singular)
    add('labels.plural', config.labels?.plural)
  }
  if ('label' in config) add('label', config.label)
  add('admin.group', config.admin?.group)

  const walk = (fields: Field[], path: string) => {
    for (const field of fields) {
      const name = 'name' in field ? `${path}${field.name}` : `${path}(${field.type})`
      // Groups shown without a heading opt out with `label: false`.
      if ('label' in field && field.label !== false) add(name, field.label)
      else if ('name' in field && !('label' in field)) add(name, undefined)
      const description = field.admin && 'description' in field.admin && field.admin.description
      if (description) add(`${name} description`, description)
      if ('options' in field) {
        // A plain string is the same in every language: a brand or a language's own name.
        for (const option of field.options) {
          if (typeof option === 'object' && typeof option.label === 'object') {
            add(`${name} option ${option.value}`, option.label)
          }
        }
      }
      if ('fields' in field) walk(field.fields, `${name}.`)
      if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          add(`tab ${'name' in tab ? tab.name : ''}`, tab.label)
          walk(tab.fields, path)
        }
      }
    }
  }
  walk(config.fields, '')
  return found
}

describe('admin labels', () => {
  const configs = [
    Contests,
    CampaignLinks,
    Draws,
    Winners,
    Participations,
    Tickets,
    Contacts,
    ConsentRecords,
    Media,
    Users,
    Settings,
  ]

  it.each(configs.map((config) => [config.slug, config] as const))(
    'translates every %s label into French, English and Arabic',
    (_, config) => {
      const untranslated = texts(config)
        .filter(([, value]) => {
          const record = value as Record<string, unknown> | undefined
          return languages.some(
            (language) =>
              typeof record?.[language] !== 'string' || !(record[language] as string).trim(),
          )
        })
        .map(([where]) => where)

      expect(untranslated).toEqual([])
    },
  )
})
