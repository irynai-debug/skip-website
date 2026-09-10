'use client'

import React, { useEffect, useRef, useState } from 'react'
import content from './content.json' with { type: 'json' }
import { Button, Type } from './design-system/index.jsx'
import { readCookieConsentPreference, storeCookieConsentPreference } from './cookieConsent.js'

export function CookieConsent({ storage }) {
  const hasInjectedStorage = storage !== undefined
  const storageRef = useRef(storage)
  const [visible, setVisible] = useState(() => (
    hasInjectedStorage ? readCookieConsentPreference(storageRef.current) === null : false
  ))
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (hasInjectedStorage) return

    try {
      storageRef.current = window.localStorage
    } catch {
      storageRef.current = undefined
    }
    setVisible(readCookieConsentPreference(storageRef.current) === null)
  }, [hasInjectedStorage])

  if (!visible) return null

  const choosePreference = (preference) => {
    if (closing) return
    storeCookieConsentPreference(storageRef.current, preference)

    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) {
      setVisible(false)
      return
    }

    setClosing(true)
  }

  const finishClosing = (event) => {
    if (closing && event.animationName === 'cookie-consent-exit') setVisible(false)
  }

  return (
    <aside
      className="cookie-consent"
      data-consent-state={closing ? 'closing' : 'visible'}
      data-ds-theme="inverse"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      onAnimationEnd={finishClosing}
    >
      <div className="cookie-consent__copy">
        <Type as="h2" role="h3" id="cookie-consent-title">{content.cookieConsent.title}</Type>
        <Type
          id="cookie-consent-description"
          data-ds-exempt="Cookie consent supporting copy uses the inverse secondary text token"
        >{content.cookieConsent.description}</Type>
      </div>
      <div className="cookie-consent__actions">
        <Button size="small" variant="primary-borderless" data-cookie-preference="accepted" onClick={() => choosePreference('accepted')}>{content.cookieConsent.acceptButton}</Button>
        <Button size="small" variant="outline" data-cookie-preference="declined" onClick={() => choosePreference('declined')}>{content.cookieConsent.declineButton}</Button>
      </div>
    </aside>
  )
}
