'use client'

import {
  SaveButton as PayloadSaveButton,
  useFormModified,
  useOperation,
  useTranslation,
} from '@payloadcms/ui'

const nothingToSave = {
  fr: 'Aucune modification à enregistrer',
  en: 'No changes to save',
  ar: 'لا توجد تعديلات لحفظها',
}

/**
 * Payload's Save button, which stays greyed out until something changes, with a hover text saying
 * why: a greyed-out button alone reads as a missing permission. A disabled button gets no hover,
 * so the text sits on its wrapper.
 */
export function SaveButton() {
  const { i18n } = useTranslation()
  const modified = useFormModified()
  const unchanged = useOperation() === 'update' && !modified
  const title = unchanged
    ? (nothingToSave[i18n.language as keyof typeof nothingToSave] ?? nothingToSave.fr)
    : undefined

  return (
    <span title={title} style={{ display: 'inline-flex' }}>
      <PayloadSaveButton />
    </span>
  )
}
