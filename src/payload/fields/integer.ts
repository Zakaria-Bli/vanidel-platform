import { validations, type NumberFieldSingleValidation } from 'payload'

/**
 * Number validation that also requires a whole number. `admin.step` only shapes the admin input;
 * this runs on every write, including the REST and Local APIs.
 */
export const integer: NumberFieldSingleValidation = (value, args) => {
  const result = (validations.number as NumberFieldSingleValidation)(value, args)
  if (result !== true || value === null || value === undefined) return result
  if (Number.isInteger(value)) return true
  return args.req.i18n?.language === 'fr' ? 'Saisissez un nombre entier.' : 'Enter a whole number.'
}
