'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CookieConsent } from '../CookieConsent.jsx'
import { PreOrderModal } from '../PreOrderModal.jsx'
import { GridOverlay } from '../design-system/GridOverlay.jsx'
import { useMotionEffects } from '../motion.jsx'
import { createPointerDepthController } from '../motionModel.js'
import { ASSETS } from '../siteContent.js'
import { QaRuntime } from './QaRuntime.jsx'

export function SiteRuntime() {
  const [preorderOpen, setPreorderOpen] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const preorderTriggerRef = useRef(null)

  useMotionEffects()

  useLayoutEffect(() => {
    const controller = createPointerDepthController({
      root: document.getElementById('footer'),
      layers: { depth: { x: 12, y: 6 } },
      variablePrefix: 'footer',
      stateAttribute: 'footerDepth',
      matchMedia: (query) => window.matchMedia(query),
      requestFrame: (callback) => window.requestAnimationFrame(callback),
      cancelFrame: (frame) => window.cancelAnimationFrame(frame),
    })
    return () => controller.cleanup()
  }, [])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    setShowGrid(searchParams.has('grid'))

    const openPreOrder = (event) => {
      const trigger = event.target.closest('[data-preorder-trigger]')
      if (!trigger) return
      event.preventDefault()
      preorderTriggerRef.current = trigger
      setPreorderOpen(true)
    }

    document.addEventListener('click', openPreOrder)
    return () => document.removeEventListener('click', openPreOrder)
  }, [])

  return (
    <>
      <GridOverlay visible={showGrid} />
      <QaRuntime />
      <CookieConsent />
      <PreOrderModal
        open={preorderOpen}
        onRequestClose={() => setPreorderOpen(false)}
        returnFocusRef={preorderTriggerRef}
        backgroundImage={ASSETS.preorderModalBackground}
      />
    </>
  )
}
