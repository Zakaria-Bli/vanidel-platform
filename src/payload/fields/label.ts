import type { CollectionConfig, Field } from 'payload'

/** Admin label in each admin language: French (the default), English and Arabic. */
export function label(fr: string, en: string, ar: string): Record<'ar' | 'en' | 'fr', string> {
  return { fr, en, ar }
}

export const groups = {
  contests: label('Concours', 'Contests', 'المسابقات'),
  participations: label('Participations', 'Participations', 'المشاركات'),
  content: label('Contenu', 'Content', 'المحتوى'),
  administration: label('Administration', 'Administration', 'الإدارة'),
}

type Translated = Record<'ar' | 'en' | 'fr', string>
type LabelFunction = (args: { i18n: { language: string } }) => string

const isTranslated = (value: unknown): value is Translated =>
  typeof value === 'object' && value !== null && typeof (value as Translated).fr === 'string'

const pick = (value: unknown) =>
  isTranslated(value)
    ? ((({ i18n }) => value[i18n.language as keyof Translated] ?? value.fr) as LabelFunction)
    : value

/**
 * The config as Payload's admin should get it: field and collection labels as functions rather
 * than { fr, en, ar } records. A few Payload buttons print a label without translating it (the
 * column sort buttons, a relationship's "add new" button), which shows "[object Object]"; a label
 * function is resolved once per admin language, so they get a plain string. Labels stay records
 * in the collection files, where src/payload/labels.spec.ts checks every language is there.
 */
export function translatedLabels<T extends CollectionConfig>(config: T): T {
  return {
    ...config,
    labels: config.labels && {
      singular: pick(config.labels.singular),
      plural: pick(config.labels.plural),
    },
    fields: withLabelFunctions(config.fields),
  } as T
}

function withLabelFunctions(fields: Field[]): Field[] {
  return fields.map((field) => {
    const next = { ...field } as Record<string, unknown>
    if ('label' in field) next.label = pick(field.label)
    if ('fields' in field) next.fields = withLabelFunctions(field.fields)
    if (field.type === 'tabs') {
      next.tabs = field.tabs.map((tab) => ({ ...tab, fields: withLabelFunctions(tab.fields) }))
    }
    return next as Field
  })
}
