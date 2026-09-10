'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import content from './generated/content.json' with { type: 'json' }
import { TechnologyModelViewer } from './TechnologyModelViewer.js'
import { detectWebGLSupport, shouldStartTechnologyModelLoad } from './technologyModelInteraction.js'

export function TechnologyMedia({ modelSrc, poster }) {
  const mediaRef = useRef(null)
  const [isNearViewport, setIsNearViewport] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [webglAvailable, setWebglAvailable] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const media = mediaRef.current
    if (!media) return undefined

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let observer

    const supportsWebGL = () => detectWebGLSupport(() => document.createElement('canvas'))
    const observeProximity = () => {
      observer?.disconnect()
      if (reducedMotionQuery.matches) return
      if (!('IntersectionObserver' in window)) {
        setIsNearViewport(true)
        return
      }
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setIsNearViewport(true)
        observer?.disconnect()
      }, { rootMargin: '480px 0px', threshold: 0.01 })
      observer.observe(media)
    }

    const syncMotionPreference = () => {
      const reduced = reducedMotionQuery.matches
      setReducedMotion(reduced)
      setWebglAvailable(reduced ? false : supportsWebGL())
      if (reduced) {
        setIsNearViewport(false)
        setModelReady(false)
        observer?.disconnect()
      } else {
        observeProximity()
      }
    }

    syncMotionPreference()
    reducedMotionQuery.addEventListener?.('change', syncMotionPreference)

    return () => {
      observer?.disconnect()
      reducedMotionQuery.removeEventListener?.('change', syncMotionPreference)
    }
  }, [])

  const shouldLoad = shouldStartTechnologyModelLoad({
    isNearViewport,
    reducedMotion,
    webglAvailable,
    failed,
  })
  const state = shouldLoad && modelReady ? 'ready' : failed ? 'fallback' : 'poster'
  const handleReady = useCallback(() => setModelReady(true), [])
  const handleError = useCallback(() => {
    setFailed(true)
    setModelReady(false)
  }, [])

  return React.createElement(
    'div',
    { className: 'technology__media', 'data-model-state': state, ref: mediaRef },
    React.createElement('img', {
      alt: state === 'ready' ? '' : content.technology.productDescription,
      className: 'technology__poster',
      decoding: 'async',
      height: poster.height,
      loading: 'lazy',
      sizes: poster.sizes,
      src: poster.src,
      srcSet: poster.srcSet,
      width: poster.width,
    }),
    shouldLoad
      ? React.createElement(TechnologyModelViewer, {
          modelSrc,
          onError: handleError,
          onReady: handleReady,
        })
      : null,
  )
}
