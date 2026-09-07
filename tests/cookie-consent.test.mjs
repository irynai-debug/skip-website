import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_PREFERENCES,
  readCookieConsentPreference,
  storeCookieConsentPreference,
} from '../src/cookieConsent.js'

function createStorage(initialValue) {
  const values = new Map()
  if (initialValue !== undefined) values.set(COOKIE_CONSENT_KEY, initialValue)

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      values.set(key, value)
    },
  }
}

test('a first visit has no stored cookie preference', () => {
  assert.equal(readCookieConsentPreference(createStorage()), null)
})

test('accepted and declined preferences persist exactly', () => {
  for (const preference of COOKIE_CONSENT_PREFERENCES) {
    const storage = createStorage()
    assert.equal(storeCookieConsentPreference(storage, preference), true)
    assert.equal(readCookieConsentPreference(storage), preference)
  }
})

test('unknown stored values are treated as no preference', () => {
  assert.equal(readCookieConsentPreference(createStorage('dismissed')), null)
})

test('storage failures leave the consent banner available without throwing', () => {
  const unavailableStorage = {
    getItem() { throw new Error('blocked') },
    setItem() { throw new Error('blocked') },
  }

  assert.equal(readCookieConsentPreference(unavailableStorage), null)
  assert.equal(storeCookieConsentPreference(unavailableStorage, 'accepted'), false)
})

test('invalid preferences are rejected instead of being persisted', () => {
  const storage = createStorage()
  assert.equal(storeCookieConsentPreference(storage, 'dismissed'), false)
  assert.equal(readCookieConsentPreference(storage), null)
})

test('the default server render defers browser storage so hydration starts from stable markup', async () => {
  const { CookieConsent } = await import('../src/CookieConsent.jsx')
  assert.equal(renderToStaticMarkup(React.createElement(CookieConsent)), '')
})

test('a first visit renders one accessible compact consent region with both actions', async () => {
  const { CookieConsent } = await import('../src/CookieConsent.jsx')
  const html = renderToStaticMarkup(React.createElement(CookieConsent, { storage: createStorage() }))

  assert.match(html, /<aside[^>]+aria-labelledby="cookie-consent-title"[^>]+aria-describedby="cookie-consent-description"/)
  assert.match(html, /<h2[^>]+id="cookie-consent-title"[^>]*>Cookies, your choice<\/h2>/)
  assert.match(html, /id="cookie-consent-description"[^>]*>We use cookies to improve your experience and understand how our site is used\.<\/p>/)
  assert.match(html, /<button[^>]+data-cookie-preference="accepted"[^>]*>[\s\S]*ACCEPT[\s\S]*<\/button>/)
  assert.match(html, /<button[^>]+data-cookie-preference="declined"[^>]*>[\s\S]*DECLINE[\s\S]*<\/button>/)
})

test('a returning visit with either stored choice renders no consent banner', async () => {
  const { CookieConsent } = await import('../src/CookieConsent.jsx')

  for (const preference of COOKIE_CONSENT_PREFERENCES) {
    const html = renderToStaticMarkup(React.createElement(CookieConsent, { storage: createStorage(preference) }))
    assert.equal(html, '')
  }
})
