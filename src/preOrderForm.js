const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

const regionCodes = Array.from(alphabet, (first) => (
  Array.from(alphabet, (second) => `${first}${second}`)
)).flat()

const seenRegionLabels = new Set()

export const COUNTRIES = Object.freeze(regionCodes
  .map((code) => ({ code, label: regionNames.of(code) }))
  .filter(({ code, label }) => label && label !== code && label !== 'Unknown Region')
  .filter(({ label }) => {
    if (seenRegionLabels.has(label)) return false
    seenRegionLabels.add(label)
    return true
  })
  .sort((left, right) => left.label.localeCompare(right.label, 'en'))
  .map(Object.freeze))

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validatePreOrderForm(values = {}) {
  const errors = {}
  const firstName = values.firstName?.trim()
  const lastName = values.lastName?.trim()
  const email = values.email?.trim()

  if (!firstName) errors.firstName = content.preOrderModal.fields.firstName.requiredError
  if (!lastName) errors.lastName = content.preOrderModal.fields.lastName.requiredError
  if (!email) errors.email = content.preOrderModal.fields.email.requiredError
  else if (!emailPattern.test(email)) errors.email = content.preOrderModal.fields.email.invalidError
  if (!values.country) errors.country = content.preOrderModal.fields.country.requiredError

  return errors
}
import content from './content.json' with { type: 'json' }
