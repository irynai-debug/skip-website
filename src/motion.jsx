'use client'

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Type } from './design-system/index.jsx'
import {
  buildHowStepStates,
  createHowItWorksProgressionController,
  createPointerDepthController,
  createTechnologyAnnotationDepthController,
} from './motionModel.js'
import { resolveHeaderMode } from './motionModel.js'
import { MOTION_TIMING, countMetric, easeInOutSine } from './motionModel.js'

export function useMotionEffects() {
  useLayoutEffect(() => {
    const root = document.documentElement
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileMotion = window.matchMedia('(max-width: 640px)')
    const motionSections = Array.from(document.querySelectorAll('[data-motion-section]'))
    const parallaxElements = Array.from(document.querySelectorAll('[data-motion-parallax]'))
    const heroParallax = document.querySelector('[data-motion-hero-parallax]')
    const heroParallaxAnchor = document.querySelector('[data-motion-hero-parallax-anchor]')
    const searchParams = new URLSearchParams(window.location.search)
    const settledQa = searchParams.get('qa') === 'settled'
    const settledQaSection = searchParams.get('section')

    motionSections.forEach((section) => section.classList.remove('is-inview', 'is-motion-visible'))
    root.classList.remove('motion-animate')
    root.classList.add('motion-ready')

    const initialMotionTargets = motionSections.flatMap((section) => Array.from(section.querySelectorAll([
      '[data-motion-heading] .motion-heading__line-inner',
      '[data-motion-slide]',
      '.hero__scene-glow',
      '.hero__scene-vignette',
      '.hero__background',
      '.hero__lead-motion',
      '[data-motion-group]',
      '[data-footer-entrance]',
      '[data-how-entrance]',
    ].join(', '))))

    initialMotionTargets.forEach((target) => {
      const style = window.getComputedStyle(target)
      void style.opacity
      void style.transform
      void style.clipPath
    })

    let observer
    let revealFrameOne = 0
    let revealFrameTwo = 0
    let qaScrollFrame = 0
    let startObserverAfterLoad
    if (settledQa) root.classList.add('qa-settled')
    if (settledQa || reducedMotion.matches || !('IntersectionObserver' in window)) {
      root.classList.add('motion-animate')
      motionSections.forEach((section) => section.classList.add('is-inview', 'is-motion-visible'))
      if (settledQaSection) {
        qaScrollFrame = window.requestAnimationFrame(() => {
          const target = document.getElementById(settledQaSection)
          if (target) window.scrollTo({ top: target.offsetTop, behavior: 'instant' })
        })
      }
    } else {
      const startObserver = () => {
        observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            const section = entry.target
            section.classList.add('is-inview', 'is-motion-visible')
            observer?.unobserve(section)
          })
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.04 })
        motionSections.forEach((section) => observer?.observe(section))
      }

      const scheduleObserver = () => {
        revealFrameOne = window.requestAnimationFrame(() => {
          root.classList.add('motion-animate')
          revealFrameTwo = window.requestAnimationFrame(startObserver)
        })
      }

      if (document.readyState === 'complete') scheduleObserver()
      else {
        startObserverAfterLoad = scheduleObserver
        window.addEventListener('load', startObserverAfterLoad, { once: true })
      }
    }

    let frame = 0
    const updateParallax = () => {
      frame = 0
      const disabled = reducedMotion.matches || mobileMotion.matches

      if (heroParallax) {
        const speed = Number(heroParallax.dataset.motionHeroParallaxSpeed ?? 0.04)
        const maximumTravel = Number(heroParallax.dataset.motionHeroParallaxDistance ?? 24)
        const anchorY = heroParallaxAnchor
          ? heroParallaxAnchor.getBoundingClientRect().top + window.scrollY
          : 0
        const proposedTravel = disabled ? 0 : Math.max(0, window.scrollY - anchorY) * speed
        const travel = Math.max(0, Math.min(maximumTravel, proposedTravel))
        heroParallax.style.setProperty('--hero-graphics-y', `${travel.toFixed(2)}px`)
      }

      parallaxElements.forEach((element) => {
        const scale = Number(element.dataset.motionScale ?? 1.08)
        element.style.setProperty('--parallax-scale', String(scale))

        if (disabled) {
          element.style.setProperty('--parallax-y', '0px')
          return
        }

        const rect = element.getBoundingClientRect()
        const speed = Number(element.dataset.motionSpeed ?? 0.05)
        const nearViewport = rect.bottom > -window.innerHeight && rect.top < window.innerHeight * 2
        element.classList.toggle('is-parallax-near', nearViewport && !disabled)
        const maximumTravel = element.clientHeight * Math.max(0, scale - 1) * 0.5
        const viewportCenter = window.innerHeight * 0.5
        const elementCenter = rect.top + rect.height * 0.5
        const proposedTravel = (viewportCenter - elementCenter) * speed
        const travel = Math.max(-maximumTravel, Math.min(maximumTravel, proposedTravel))
        element.style.setProperty('--parallax-y', `${travel.toFixed(2)}px`)
      })
    }

    const requestParallaxUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateParallax)
    }

    updateParallax()
    window.addEventListener('scroll', requestParallaxUpdate, { passive: true })
    window.addEventListener('resize', requestParallaxUpdate)
    reducedMotion.addEventListener('change', requestParallaxUpdate)
    mobileMotion.addEventListener('change', requestParallaxUpdate)

    return () => {
      observer?.disconnect()
      if (startObserverAfterLoad) window.removeEventListener('load', startObserverAfterLoad)
      if (revealFrameOne) window.cancelAnimationFrame(revealFrameOne)
      if (revealFrameTwo) window.cancelAnimationFrame(revealFrameTwo)
      if (qaScrollFrame) window.cancelAnimationFrame(qaScrollFrame)
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestParallaxUpdate)
      window.removeEventListener('resize', requestParallaxUpdate)
      reducedMotion.removeEventListener('change', requestParallaxUpdate)
      mobileMotion.removeEventListener('change', requestParallaxUpdate)
      parallaxElements.forEach((element) => element.classList.remove('is-parallax-near'))
      heroParallax?.style.removeProperty('--hero-graphics-y')
      root.classList.remove('motion-animate')
      root.classList.remove('qa-settled')
    }
  }, [])
}

export function usePointerDepth(ref, layers, { variablePrefix = 'hero', stateAttribute } = {}) {
  useLayoutEffect(() => {
    const controller = createPointerDepthController({
      root: ref.current,
      layers,
      variablePrefix,
      stateAttribute,
      matchMedia: (query) => window.matchMedia(query),
      requestFrame: (callback) => window.requestAnimationFrame(callback),
      cancelFrame: (frame) => window.cancelAnimationFrame(frame),
    })
    return () => controller.cleanup()
  }, [layers, ref, stateAttribute, variablePrefix])
}

export function useTechnologyAnnotationDepth() {
  const sectionRef = useRef(null)

  useLayoutEffect(() => {
    const controller = createTechnologyAnnotationDepthController({
      root: sectionRef.current,
      matchMedia: (query) => window.matchMedia(query),
      requestFrame: (callback) => window.requestAnimationFrame(callback),
      cancelFrame: (frame) => window.cancelAnimationFrame(frame),
    })
    return () => controller.cleanup()
  }, [])

  return sectionRef
}

function useCountUp({ target, precision, active, duration }) {
  const [count, setCount] = useState(() => active ? target : 0)
  const completed = useRef(false)

  useEffect(() => {
    if (!active || completed.current) return undefined
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const settledQa = new URLSearchParams(window.location.search).get('qa') === 'settled'
    if (reducedMotion || settledQa) {
      completed.current = true
      setCount(target)
      return undefined
    }

    completed.current = true
    setCount(countMetric(0, target, precision))
    let frame = 0
    let startedAt
    const update = (timestamp) => {
      startedAt ??= timestamp
      const progress = Math.min(1, (timestamp - startedAt) / duration)
      setCount(countMetric(easeInOutSine(progress), target, precision))
      if (progress < 1) frame = window.requestAnimationFrame(update)
    }
    frame = window.requestAnimationFrame(update)
    return () => window.cancelAnimationFrame(frame)
  }, [active, duration, precision, target])

  return count
}

export function CountUpMetric({ value, active, duration = MOTION_TIMING.heroCount }) {
  const rootRef = useRef(null)
  const [sectionActive, setSectionActive] = useState(Boolean(active))
  const match = String(value).match(/([\d.]+)(.*)/)
  const numericValue = match?.[1] ?? '0'
  const target = Number(numericValue)
  const suffix = match?.[2] ?? ''
  const precision = numericValue.includes('.') ? numericValue.split('.')[1].length : 0
  const reservedValue = `${numericValue.replace(/\d/g, '0')}${suffix}`

  useEffect(() => {
    if (active !== undefined) {
      setSectionActive(Boolean(active))
      return undefined
    }

    const section = rootRef.current?.closest('[data-motion-section]')
    if (!section) {
      setSectionActive(true)
      return undefined
    }
    const update = () => setSectionActive(section.classList.contains('is-motion-visible'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(section, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [active])

  const count = useCountUp({ target, precision, active: sectionActive, duration })
  const renderedValue = `${count.toFixed(precision)}${suffix}`
  return (
    <span ref={rootRef} className="count-up-metric" aria-label={value} data-count-duration-ms={duration}>
      <span className="count-up-metric__measure" aria-hidden="true">{value}</span>
      <span className="count-up-metric__reserve" aria-hidden="true">{reservedValue}</span>
      <span className="count-up-metric__value" aria-hidden="true">{renderedValue}</span>
    </span>
  )
}

export function useHowItWorksProgression(stepCount) {
  const sectionRef = useRef(null)
  const controllerRef = useRef(null)
  const [progression, setProgression] = useState(() => ({
    activeStepIndex: 0,
    isCycleRunning: false,
    stepStates: buildHowStepStates(0, stepCount),
  }))

  useEffect(() => {
    const controller = createHowItWorksProgressionController({
      target: sectionRef.current,
      stepCount,
      onStateChange: setProgression,
      matchMedia: (query) => window.matchMedia(query),
      Observer: window.IntersectionObserver,
    })
    controllerRef.current = controller

    return () => {
      controller.cleanup()
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [stepCount])

  const advanceStep = useCallback((event) => {
    controllerRef.current?.handleAnimationEnd(event)
  }, [])

  return { sectionRef, advanceStep, ...progression }
}

export function MotionHeading({ as = 'h2', lines, accessibleLabel, role = 'heading-medium', className = '', id, motionMode = 'lines', ...props }) {
  const label = accessibleLabel ?? lines.filter((line) => typeof line === 'string').join(' ')
  return (
    <Type
      as={as}
      role={role}
      className={className}
      id={id}
      {...props}
      data-motion-heading
      data-motion-heading-mode={motionMode}
    >
      <span className="ds-sr-only">{label}</span>
      <span className="motion-heading__visual" aria-hidden="true">
        {lines.map((line, lineIndex) => (
          <span className="motion-heading__line" key={lineIndex}>
            <span
              className="motion-heading__line-inner"
              style={{ '--line-index': lineIndex }}
            >
              {line}
            </span>
          </span>
        ))}
      </span>
    </Type>
  )
}

export function useHeaderMotionState() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('hero')
  const [introComplete, setIntroComplete] = useState(false)
  const modeRef = useRef(mode)
  const introDoneRef = useRef(introComplete)

  modeRef.current = mode
  introDoneRef.current = introComplete

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('qa') === 'settled') {
      setIntroComplete(true)
      return undefined
    }
    const introTimer = window.setTimeout(() => setIntroComplete(true), 1450)
    return () => window.clearTimeout(introTimer)
  }, [])

  useLayoutEffect(() => {
    let frame = 0
    let lastScrollY = Math.max(0, window.scrollY)
    let direction = null
    let directionDistance = 0
    let pastHero = false

    const resetTravel = (scrollY) => {
      lastScrollY = scrollY
      direction = null
      directionDistance = 0
    }

    const update = (resetDirection = false) => {
      frame = 0
      const scrollY = Math.max(0, window.scrollY)
      const contentStart = document.querySelector('[data-nav-content-start]')
      const contentTop = contentStart?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY

      if (!pastHero && contentTop <= 0) {
        pastHero = true
        setOpen(false)
      }

      if (pastHero && contentTop >= 96) {
        pastHero = false
        setOpen(false)
      }

      if (resetDirection) {
        resetTravel(scrollY)
      } else if (pastHero) {
        const delta = scrollY - lastScrollY
        lastScrollY = scrollY
        if (Math.abs(delta) < 0.5) return

        const nextDirection = delta > 0 ? 'down' : 'up'
        if (direction !== nextDirection) {
          direction = nextDirection
          directionDistance = 0
        }
        directionDistance += Math.abs(delta)
      } else {
        resetTravel(scrollY)
      }

      const nextMode = resolveHeaderMode({
        introComplete: introDoneRef.current,
        withinHero: !pastHero,
        direction,
        directionDistance,
        currentMode: modeRef.current,
      })
      if (nextMode !== modeRef.current) {
        modeRef.current = nextMode
        directionDistance = 0
        if (nextMode === 'dormant' || nextMode === 'hidden' || nextMode === 'hero') setOpen(false)
        setMode(nextMode)
      }
    }

    const requestUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => update())
    }
    const requestResizeUpdate = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => update(true))
    }

    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestResizeUpdate)
    update(true)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestResizeUpdate)
    }
  }, [introComplete])

  return { open, setOpen, mode, introComplete }
}
