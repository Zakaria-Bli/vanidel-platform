import type { Field } from 'payload'

/**
 * Marks fields read-only in the admin. For records written only by application services
 * (participations, consents, draws…), where the admin is for reading, not editing.
 */
export function readOnly(fields: Field[]): Field[] {
  return fields.map((field) =>
    'name' in field ? ({ ...field, admin: { ...field.admin, readOnly: true } } as Field) : field,
  )
}
