import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { COUNTRIES, validatePreOrderForm } from '../src/preOrderForm.js'
import { ASSETS } from '../src/siteContent.js'

test('the built-in country and region list is complete, unique, and alphabetical', () => {
  assert.ok(COUNTRIES.length > 240)
  assert.equal(new Set(COUNTRIES.map(({ code }) => code)).size, COUNTRIES.length)
  assert.equal(new Set(COUNTRIES.map(({ label }) => label)).size, COUNTRIES.length)
  assert.deepEqual(
    COUNTRIES.map(({ label }) => label),
    [...COUNTRIES].map(({ label }) => label).sort((left, right) => left.localeCompare(right, 'en')),
  )
})

test('empty pre-order values return one accessible error per required field', () => {
  assert.deepEqual(validatePreOrderForm({ firstName: '', lastName: '', email: '', country: '' }), {
    firstName: 'Enter your first name.',
    lastName: 'Enter your last name.',
    email: 'Enter your email address.',
    country: 'Select a country or region.',
  })
})

test('the pre-order form rejects a malformed email address', () => {
  assert.deepEqual(validatePreOrderForm({
    firstName: 'Maya',
    lastName: 'Lopez',
    email: 'invalid@',
    country: 'US',
  }), { email: 'Enter a valid email address.' })
})

test('valid pre-order values pass frontend validation without submission data', () => {
  assert.deepEqual(validatePreOrderForm({
    firstName: 'Maya',
    lastName: 'Lopez',
    email: 'maya@example.com',
    country: 'US',
  }), {})
})

test('the design-system Field renders a labelled invalid input with an announced error', async () => {
  const { DS_CONTRACT, Field } = await import('../src/design-system/index.jsx')

  assert.equal(typeof Field, 'function')
  assert.deepEqual(DS_CONTRACT.components.field.variants, ['input', 'select'])

  const html = renderToStaticMarkup(React.createElement(Field, {
    id: 'email',
    name: 'email',
    label: 'EMAIL ADDRESS',
    type: 'email',
    autoComplete: 'email',
    required: true,
    error: 'Enter a valid email address.',
  }))

  assert.match(html, /<label[^>]+for="email"[^>]*>EMAIL ADDRESS<\/label>/)
  const input = html.match(/<input[^>]+>/)?.[0] ?? ''
  assert.match(input, /id="email"/)
  assert.match(input, /name="email"/)
  assert.match(input, /type="email"/)
  assert.match(input, /data-ds-part="control"/)
  assert.match(input, /aria-invalid="true"/)
  assert.match(input, /aria-describedby="email-error"/)
  assert.match(html, /id="email-error"[^>]+role="alert"[^>]*>Enter a valid email address\.<\/span>/)
})

test('the design-system Field renders a native labelled country selector', async () => {
  const { Field } = await import('../src/design-system/index.jsx')
  const html = renderToStaticMarkup(React.createElement(Field, {
    id: 'country',
    name: 'country',
    label: 'COUNTRY / REGION',
    required: true,
    options: [
      { code: 'CA', label: 'Canada' },
      { code: 'US', label: 'United States' },
    ],
  }))

  assert.match(html, /<label[^>]+for="country"[^>]*>COUNTRY \/ REGION<\/label>/)
  assert.match(html, /<select[^>]+id="country"[^>]+name="country"[^>]+required=""[^>]+data-ds-part="control"/)
  assert.match(html, /<option value="CA">Canada<\/option>/)
  assert.match(html, /<option value="US">United States<\/option>/)
})

test('the shared pre-order dialog exposes the complete accessible frontend form', async () => {
  const { PreOrderModal } = await import('../src/PreOrderModal.jsx')
  const html = renderToStaticMarkup(React.createElement(PreOrderModal, {
    open: true,
    backgroundImage: ASSETS.preorderModalBackground,
    onRequestClose() {},
  }))

  assert.match(html, /role="dialog"/)
  assert.match(html, /aria-modal="true"/)
  assert.match(html, /aria-labelledby="preorder-modal-title"/)
  assert.match(html, /id="preorder-modal-title"[^>]*>[\s\S]*TAKE THE[\s\S]*NEXT STEP/)
  assert.match(html, /Reserve your MO\/GO and be the first to[\s\S]*experience the future of movement\./)
  assert.match(html, /aria-label="Close pre-order form"/)

  for (const [id, type] of [['firstName', 'text'], ['lastName', 'text'], ['email', 'email']]) {
    const input = html.match(new RegExp(`<input[^>]+id="${id}"[^>]*>`))?.[0] ?? ''
    assert.match(input, new RegExp(`name="${id}"`))
    assert.match(input, new RegExp(`type="${type}"`))
    assert.match(input, /required=""/)
  }

  assert.match(html, /<select[^>]+id="country"[^>]+name="country"[^>]+required=""/)
  assert.match(html, /<button[^>]+type="submit"[^>]*>[\s\S]*RESERVE YOUR MO\/GO[\s\S]*<\/button>/)
  assert.doesNotMatch(html, /<form[^>]+action=/)
  assert.match(html, /<img[^>]+src="\/assets\/skip\/optimized\/modal-3200\.webp"[^>]+alt=""/)
  assert.match(html, /<img[^>]+srcSet="[^"]+modal-800\.webp 800w[^"]+modal-3200\.webp 3200w"/)
})

test('the site renders exactly the four approved modal triggers as actions instead of navigation links', async () => {
  const previousWindow = globalThis.window
  globalThis.window = {
    location: { search: '' },
    matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
  }

  try {
    const { Site } = await import('../src/Site.jsx')
    const html = renderToStaticMarkup(React.createElement(Site))
    const buttons = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(([button]) => button)
    const preorderButtons = buttons.filter((button) => button.includes('PRE-ORDER'))
    const reserveButtons = buttons.filter((button) => button.includes('RESERVE YOUR SPOT'))

    assert.equal(preorderButtons.length, 1)
    assert.equal(reserveButtons.length, 3)
    assert.equal(preorderButtons[0].includes('data-preorder-trigger="header"'), true)
    assert.deepEqual(
      reserveButtons.map((button) => button.match(/data-preorder-trigger="([^"]+)"/)?.[1]).sort(),
      ['footer', 'hero', 'how-it-works'],
    )
    preorderButtons.concat(reserveButtons).forEach((button) => assert.doesNotMatch(button, /\shref=/))
    assert.equal(buttons.some((button) => button.includes('SEE MO/GO IN ACTION') && button.includes('data-preorder-trigger')), false)
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})
