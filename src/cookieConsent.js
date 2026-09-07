export const COOKIE_CONSENT_KEY = 'skip:cookie-consent:v1'
export const COOKIE_CONSENT_PREFERENCES = Object.freeze(['accepted', 'declined'])

const isCookieConsentPreference = (value) => COOKIE_CONSENT_PREFERENCES.includes(value)

export function readCookieConsentPreference(storage) {
  try {
    const value = storage?.getItem(COOKIE_CONSENT_KEY)
    return isCookieConsentPreference(value) ? value : null
  } catch {
    return null
  }
}

export function storeCookieConsentPreference(storage, preference) {
  if (!isCookieConsentPreference(preference)) return false

  try {
    storage?.setItem(COOKIE_CONSENT_KEY, preference)
    return true
  } catch {
    return false
  }
}
