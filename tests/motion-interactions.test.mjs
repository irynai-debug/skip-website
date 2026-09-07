import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const importMotionModel = () => import('../src/motionModel.js')
const require = createRequire(import.meta.url)
const postcss = require('postcss')

function computeClassCascade(css, { classes, property, viewportWidth }) {
  const root = postcss.parse(css)
  let winner = null
  let sourceOrder = 0

  const mediaApplies = (rule) => {
    let parent = rule.parent
    while (parent) {
      if (parent.type === 'atrule' && parent.name === 'media') {
        const maximum = parent.params.match(/max-width:\s*(\d+)px/)
        const minimum = parent.params.match(/min-width:\s*(\d+)px/)
        if (maximum && viewportWidth > Number(maximum[1])) return false
        if (minimum && viewportWidth < Number(minimum[1])) return false
      }
      parent = parent.parent
    }
    return true
  }

  const selectorMatches = (selector) => {
    if (/[>+~]/.test(selector) || /\s/.test(selector.trim())) return false
    const excluded = Array.from(selector.matchAll(/:not\(\.([\w-]+)\)/g), (match) => match[1])
    if (excluded.some((className) => classes.has(className))) return false
    const directSelector = selector.replace(/:not\([^)]*\)/g, '')
    const required = Array.from(directSelector.matchAll(/\.([\w-]+)/g), (match) => match[1])
    return required.length > 0 && required.every((className) => classes.has(className))
  }

  root.walkRules((rule) => {
    sourceOrder += 1
    if (!mediaApplies(rule)) return
    const matchingSelectors = rule.selectors.filter(selectorMatches)
    if (matchingSelectors.length === 0) return
    const specificity = Math.max(...matchingSelectors.map(
      (selector) => (selector.match(/\.[\w-]+/g) ?? []).length,
    ))
    rule.walkDecls(property, (declaration) => {
      const candidate = { important: declaration.important, specificity, sourceOrder, value: declaration.value }
      if (
        !winner
        || Number(candidate.important) > Number(winner.important)
        || (candidate.important === winner.important && candidate.specificity > winner.specificity)
        || (candidate.important === winner.important && candidate.specificity === winner.specificity && candidate.sourceOrder >= winner.sourceOrder)
      ) winner = candidate
    })
  })

  return winner?.value
}

function createHowProgressionBrowserDoubles({ reducedMotion = false } = {}) {
  const preferenceListeners = new Set()
  const preference = {
    matches: reducedMotion,
    addEventListener(type, listener) {
      if (type === 'change') preferenceListeners.add(listener)
    },
    removeEventListener(type, listener) {
      if (type === 'change') preferenceListeners.delete(listener)
    },
    setMatches(matches) {
      this.matches = matches
      preferenceListeners.forEach((listener) => listener({ matches }))
    },
  }
  const observers = []

  class ObserverDouble {
    constructor(callback, options) {
      this.callback = callback
      this.options = options
      this.target = null
      this.disconnected = false
      observers.push(this)
    }

    observe(target) {
      this.target = target
    }

    disconnect() {
      this.disconnected = true
    }

    emit(entry) {
      if (!this.disconnected) this.callback([entry])
    }
  }

  return {
    ObserverDouble,
    matchMedia(query) {
      assert.equal(query, '(prefers-reduced-motion: reduce)')
      return preference
    },
    observers,
    preference,
    preferenceListeners,
  }
}

function createTechnologyDepthBrowserDoubles() {
  const listeners = new Map()
  const styleValues = new Map()
  const mediaQueries = new Map([
    ['(prefers-reduced-motion: reduce)', false],
    ['(hover: hover) and (pointer: fine)', true],
  ].map(([query, matches]) => {
    const changeListeners = new Set()
    return [query, {
      matches,
      addEventListener(type, listener) {
        if (type === 'change') changeListeners.add(listener)
      },
      removeEventListener(type, listener) {
        if (type === 'change') changeListeners.delete(listener)
      },
      setMatches(nextMatches) {
        this.matches = nextMatches
        changeListeners.forEach((listener) => listener({ matches: nextMatches }))
      },
      listenerCount() {
        return changeListeners.size
      },
    }]
  }))
  const frames = new Map()
  let nextFrame = 1
  const root = {
    dataset: { modelInteracting: 'false', technologyDepth: 'static' },
    style: {
      setProperty(name, value) { styleValues.set(name, value) },
      removeProperty(name) { styleValues.delete(name) },
      getPropertyValue(name) { return styleValues.get(name) ?? '' },
    },
    getBoundingClientRect() {
      return { left: 100, top: 50, width: 200, height: 100 }
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type).add(listener)
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener)
    },
    removeAttribute(name) {
      if (name === 'data-model-interacting') delete this.dataset.modelInteracting
      if (name === 'data-technology-depth') delete this.dataset.technologyDepth
    },
    dispatch(type, event = {}) {
      listeners.get(type)?.forEach((listener) => listener({ pointerType: 'mouse', ...event }))
    },
    listenerCount() {
      return Array.from(listeners.values()).reduce((count, entries) => count + entries.size, 0)
    },
  }

  return {
    root,
    mediaQueries,
    matchMedia(query) {
      const mediaQuery = mediaQueries.get(query)
      assert.ok(mediaQuery, `unexpected media query: ${query}`)
      return mediaQuery
    },
    requestFrame(callback) {
      const id = nextFrame
      nextFrame += 1
      frames.set(id, callback)
      return id
    },
    cancelFrame(id) {
      frames.delete(id)
    },
    flushFrames(limit = 100) {
      let remaining = limit
      while (frames.size && remaining > 0) {
        const pending = Array.from(frames.values())
        frames.clear()
        pending.forEach((callback) => callback())
        remaining -= 1
      }
      assert.equal(frames.size, 0, 'technology depth should settle within the frame budget')
    },
  }
}

function createPointerDepthBrowserDoubles({ finePointer = true, reducedMotion = false } = {}) {
  const listeners = new Map()
  const styleValues = new Map()
  const mediaQueries = new Map([
    ['(prefers-reduced-motion: reduce)', reducedMotion],
    ['(hover: hover) and (pointer: fine)', finePointer],
  ].map(([query, matches]) => {
    const changeListeners = new Set()
    return [query, {
      matches,
      addEventListener(type, listener) {
        if (type === 'change') changeListeners.add(listener)
      },
      removeEventListener(type, listener) {
        if (type === 'change') changeListeners.delete(listener)
      },
      setMatches(nextMatches) {
        this.matches = nextMatches
        changeListeners.forEach((listener) => listener({ matches: nextMatches }))
      },
      listenerCount() {
        return changeListeners.size
      },
    }]
  }))
  const frames = new Map()
  let nextFrame = 1
  const root = {
    dataset: {},
    style: {
      setProperty(name, value) { styleValues.set(name, value) },
      removeProperty(name) { styleValues.delete(name) },
      getPropertyValue(name) { return styleValues.get(name) ?? '' },
    },
    getBoundingClientRect() {
      return { left: 100, top: 50, width: 200, height: 100 }
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type).add(listener)
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener)
    },
    removeAttribute(name) {
      if (name === 'data-footer-depth') delete this.dataset.footerDepth
    },
    dispatch(type, event = {}) {
      listeners.get(type)?.forEach((listener) => listener({ pointerType: 'mouse', ...event }))
    },
    listenerCount() {
      return Array.from(listeners.values()).reduce((count, entries) => count + entries.size, 0)
    },
  }

  return {
    root,
    mediaQueries,
    matchMedia(query) {
      const mediaQuery = mediaQueries.get(query)
      assert.ok(mediaQuery, `unexpected media query: ${query}`)
      return mediaQuery
    },
    requestFrame(callback) {
      const id = nextFrame
      nextFrame += 1
      frames.set(id, callback)
      return id
    },
    cancelFrame(id) {
      frames.delete(id)
    },
    runNextFrame() {
      const [entry] = frames.entries()
      assert.ok(entry, 'expected a pending animation frame')
      const [id, callback] = entry
      frames.delete(id)
      callback()
    },
    flushFrames(limit = 100) {
      let remaining = limit
      while (frames.size && remaining > 0) {
        const pending = Array.from(frames.values())
        frames.clear()
        pending.forEach((callback) => callback())
        remaining -= 1
      }
      assert.equal(frames.size, 0, 'pointer depth should settle within the frame budget')
    },
  }
}

function createTestimonialTimerDoubles() {
  const timers = new Map()
  const cleared = []
  let nextTimer = 1

  return {
    timers,
    cleared,
    setTimer(callback, delay) {
      const id = nextTimer
      nextTimer += 1
      timers.set(id, { callback, delay })
      return id
    },
    clearTimer(id) {
      if (id == null) return
      cleared.push(id)
      timers.delete(id)
    },
    runTimer(id) {
      const timer = timers.get(id)
      assert.ok(timer, `expected timer ${id} to be pending`)
      timers.delete(id)
      timer.callback()
    },
  }
}

test('pointer mapping is centered and clamped', async () => {
  const { normalizePointer, mapDepth } = await importMotionModel()
  const rect = { left: 100, top: 100, width: 200, height: 100 }

  assert.deepEqual(normalizePointer(rect, 200, 150), { x: 0, y: 0 })
  assert.deepEqual(normalizePointer(rect, 500, -100), { x: 1, y: -1 })
  assert.deepEqual(mapDepth({ x: 1, y: -1 }, { x: 16, y: 8 }), { x: 16, y: -8 })
})

test('shared pointer depth clamps Footer travel, eases home, and cleans up its lifecycle', async () => {
  const { createPointerDepthController } = await importMotionModel()
  const browser = createPointerDepthBrowserDoubles()
  const controller = createPointerDepthController({
    root: browser.root,
    layers: { depth: { x: 12, y: 6 } },
    variablePrefix: 'footer',
    stateAttribute: 'footerDepth',
    matchMedia: browser.matchMedia,
    requestFrame: browser.requestFrame,
    cancelFrame: browser.cancelFrame,
  })

  assert.equal(browser.root.dataset.footerDepth, 'active')
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-x'), '0.00px')
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-y'), '0.00px')

  browser.root.dispatch('pointermove', { clientX: 500, clientY: -100 })
  browser.runNextFrame()
  assert.ok(Number.parseFloat(browser.root.style.getPropertyValue('--footer-depth-x')) > 0)
  assert.ok(Number.parseFloat(browser.root.style.getPropertyValue('--footer-depth-x')) < 12)
  browser.flushFrames()
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-x'), '12.00px')
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-y'), '-6.00px')

  browser.root.dispatch('pointerleave')
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-x'), '12.00px')
  browser.flushFrames()
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-x'), '0.00px')
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-y'), '0.00px')

  controller.cleanup()
  assert.equal(browser.root.listenerCount(), 0)
  assert.equal(browser.mediaQueries.get('(prefers-reduced-motion: reduce)').listenerCount(), 0)
  assert.equal(browser.mediaQueries.get('(hover: hover) and (pointer: fine)').listenerCount(), 0)
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-x'), '')
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-y'), '')
  assert.equal(browser.root.dataset.footerDepth, undefined)
})

test('shared pointer depth stays static for coarse, touch, and reduced-motion input', async () => {
  const { createPointerDepthController } = await importMotionModel()
  const browser = createPointerDepthBrowserDoubles({ finePointer: false })
  const controller = createPointerDepthController({
    root: browser.root,
    layers: { depth: { x: 12, y: 6 } },
    variablePrefix: 'footer',
    stateAttribute: 'footerDepth',
    matchMedia: browser.matchMedia,
    requestFrame: browser.requestFrame,
    cancelFrame: browser.cancelFrame,
  })

  assert.equal(browser.root.dataset.footerDepth, 'static')
  browser.root.dispatch('pointermove', { clientX: 300, clientY: 150 })
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-x'), '0.00px')
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-y'), '0.00px')

  browser.mediaQueries.get('(hover: hover) and (pointer: fine)').setMatches(true)
  assert.equal(browser.root.dataset.footerDepth, 'active')
  browser.root.dispatch('pointermove', { clientX: 300, clientY: 150 })
  browser.flushFrames()
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-x'), '12.00px')
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-y'), '6.00px')

  browser.root.dispatch('pointermove', { pointerType: 'touch', clientX: 300, clientY: 150 })
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-x'), '0.00px')
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-y'), '0.00px')

  browser.mediaQueries.get('(prefers-reduced-motion: reduce)').setMatches(true)
  assert.equal(browser.root.dataset.footerDepth, 'static')
  browser.root.dispatch('pointermove', { clientX: 300, clientY: 150 })
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-x'), '0.00px')
  assert.equal(browser.root.style.getPropertyValue('--footer-depth-y'), '0.00px')

  controller.cleanup()
})

test('rendered Footer wires background depth and ordered entrance groups without changing its links', async () => {
    const { Footer } = await import('../src/Site.jsx')
    assert.equal(typeof Footer, 'function')
    const markup = renderToStaticMarkup(React.createElement(Footer, { onPreOrder() {} }))

    assert.match(markup, /<footer[^>]+data-footer-depth="static"/)
    assert.match(markup, /class="footer__background"[^>]+src="\/assets\/skip\/optimized\/footer-1721\.webp"[^>]+width="1721"[^>]+height="914"[^>]+loading="lazy"[^>]+decoding="async"/)
    for (const part of ['heading', 'support', 'cta', 'navigation']) {
      assert.equal((markup.match(new RegExp(`data-footer-entrance="${part}"`, 'g')) ?? []).length, 1)
    }
    assert.match(markup, /<h2[^>]+data-footer-entrance="heading"[^>]+data-motion-heading-mode="coherent"/)
    assert.match(markup, /data-preorder-trigger="footer"/)
    assert.doesNotMatch(markup.match(/<button[^>]+data-preorder-trigger="footer"[^>]*>/)?.[0] ?? '', /\shref=/)
    assert.equal((markup.match(/class="button__label-current"/g) ?? []).length, 1)
    assert.equal((markup.match(/class="button__label-duplicate" aria-hidden="true"/g) ?? []).length, 1)

    const expectedSocials = [
      ['Instagram', 'https://www.instagram.com/elissiyas/'],
      ['YouTube', 'https://www.youtube.com/watch?v=B5lzYG83yVQ&amp;list=RDB5lzYG83yVQ&amp;start_radio=1'],
      ['LinkedIn', 'https://www.linkedin.com/in/elisdechart/'],
      ['X', 'https://x.com/DechartElis'],
    ]
    for (const [label, href] of expectedSocials) {
      const link = markup.match(new RegExp(`<a[^>]+aria-label="${label}"[^>]*>`))?.[0] ?? ''
      assert.match(link, new RegExp(`href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`))
      assert.match(link, /target="_blank"/)
      assert.match(link, /rel="noopener noreferrer"/)
    }
})

test('Footer and shared Button motion stays composited, background-only, and label-only', async () => {
  const [appCss, motionCss, dsCss] = await Promise.all([
    readFile(new URL('../src/app.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/motion.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/design-system/styles.css', import.meta.url), 'utf8'),
  ])

  assert.match(appCss, /\.footer__background\s*\{[^}]*transform:\s*translate3d\(var\(--footer-depth-x,\s*0px\),\s*var\(--footer-depth-y,\s*0px\),\s*0\)\s*scale\(1\.03\);/s)
  assert.match(appCss, /\.footer__inner\s*\{[^}]*transform:\s*none;/s)
  assert.doesNotMatch(appCss, /\.footer__(?:inner|top|cta|navigation|group|bottom|legal|socials)[^{]*\{[^}]*var\(--footer-depth-/s)

  for (const [part, delay] of [['heading', 0], ['support', 90], ['cta', 180], ['navigation', 270]]) {
    assert.match(motionCss, new RegExp(`\\[data-footer-entrance='${part}'\\][^}]*--footer-entrance-delay:\\s*${delay}ms`))
  }
  assert.match(motionCss, /html\.motion-ready \.footer \[data-footer-entrance\]\s*\{[^}]*opacity:\s*0;[^}]*filter:\s*blur\(6px\);[^}]*transform:\s*translate3d\(0,\s*-24px,\s*0\);/s)
  assert.match(motionCss, /html\.motion-ready\.motion-animate \.footer \[data-footer-entrance\]\s*\{[^}]*var\(--ds-motion-content\)[^}]*transform var\(--ds-motion-content\)[^}]*var\(--ds-motion-ease-premium\)/s)
  assert.match(motionCss, /html\.motion-ready \.footer\.is-motion-visible \[data-footer-entrance\]\s*\{[^}]*opacity:\s*1;[^}]*filter:\s*none;[^}]*transform:\s*translate3d\(0,\s*0,\s*0\);/s)
  const footerMotionRules = Array.from(
    motionCss.matchAll(/[^{}]*\.footer[^{}]*\{[^{}]*\}/g),
    ([rule]) => rule,
  ).join('\n')
  assert.doesNotMatch(footerMotionRules, /(?:transition(?:-property)?|@keyframes)[^;{}]*(?:width|height|top|right|bottom|left|margin|padding)/)

  assert.match(dsCss, /\.button__label-duplicate\s*\{[^}]*display:\s*none;/s)
  assert.match(dsCss, /@media \(hover:\s*hover\) and \(pointer:\s*fine\)\s*\{[\s\S]*\.ds-button[^{}]*:hover \.button__label-current\s*\{[^}]*animation:\s*ds-button-label-pulse 300ms var\(--ds-motion-ease-premium\);/)
  assert.match(dsCss, /@keyframes ds-button-label-pulse\s*\{\s*0%,\s*100%\s*\{[^}]*filter:\s*blur\(0\);[^}]*opacity:\s*1;[^}]*\}\s*50%\s*\{[^}]*filter:\s*blur\(4px\);[^}]*opacity:\s*\.82;[^}]*\}/s)
  assert.doesNotMatch(dsCss, /\.button__label-duplicate\s*\{[^}]*translateY/s)
  assert.doesNotMatch(dsCss, /\.ds-button\s*\{[^}]*animation:\s*ds-button-label-pulse/s)
  assert.match(dsCss, /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*\.button__label-current[^}]*animation:\s*none\s*!important;[^}]*filter:\s*none\s*!important;[^}]*opacity:\s*1;/)
})

test('loop and eased count helpers are deterministic', async () => {
  const { countMetric, easeInOutSine, easeOutCubic, nextLoopIndex, shouldRunLoop } = await importMotionModel()

  assert.equal(countMetric(0.5, 30, 0), 15)
  assert.equal(countMetric(0.5, 2.5, 1), 1.3)
  assert.equal(countMetric(1, 2.5, 1), 2.5)
  assert.equal(countMetric(2, 25, 0), 25)
  assert.equal(easeOutCubic(0), 0)
  assert.equal(easeOutCubic(0.5), 0.875)
  assert.equal(easeOutCubic(1), 1)
  assert.equal(easeInOutSine(0), 0)
  assert.ok(Math.abs(easeInOutSine(0.5) - 0.5) < Number.EPSILON)
  assert.equal(easeInOutSine(1), 1)
  assert.equal(nextLoopIndex(3, 4), 0)
  assert.equal(shouldRunLoop({ inView: true, reducedMotion: false }), true)
  assert.equal(shouldRunLoop({ inView: true, reducedMotion: true }), false)
})

test('How It Works derives row, ring, image and callout state from one active index', async () => {
  const { buildHowStepStates } = await importMotionModel()

  assert.equal(typeof buildHowStepStates, 'function')
  assert.deepEqual(buildHowStepStates(0, 4), [
    { stepState: 'active', imageState: 'active', ringActive: true, calloutsActive: true },
    { stepState: 'inactive', imageState: 'inactive', ringActive: false, calloutsActive: false },
    { stepState: 'inactive', imageState: 'inactive', ringActive: false, calloutsActive: false },
    { stepState: 'inactive', imageState: 'inactive', ringActive: false, calloutsActive: false },
  ])
  assert.deepEqual(buildHowStepStates(2, 4), [
    { stepState: 'inactive', imageState: 'inactive', ringActive: false, calloutsActive: false },
    { stepState: 'inactive', imageState: 'inactive', ringActive: false, calloutsActive: false },
    { stepState: 'active', imageState: 'active', ringActive: true, calloutsActive: false },
    { stepState: 'inactive', imageState: 'inactive', ringActive: false, calloutsActive: false },
  ])
})

test('How progression starts at the 0.2 threshold, pauses on leave, and resumes the same step', async () => {
  const { createHowItWorksProgressionController } = await importMotionModel()
  const browser = createHowProgressionBrowserDoubles()
  const target = { id: 'how-it-works' }
  const controller = createHowItWorksProgressionController({
    target,
    stepCount: 4,
    matchMedia: browser.matchMedia,
    Observer: browser.ObserverDouble,
  })
  const [observer] = browser.observers

  assert.deepEqual(observer.options, { threshold: 0.2 })
  assert.strictEqual(observer.target, target)
  observer.emit({ isIntersecting: true, intersectionRatio: 0.19 })
  assert.equal(controller.getState().isCycleRunning, false)
  observer.emit({ isIntersecting: true, intersectionRatio: 0.2 })
  assert.equal(controller.getState().isCycleRunning, true)

  controller.handleAnimationEnd({ animationName: 'how-step-progress' })
  assert.equal(controller.getState().activeStepIndex, 1)
  observer.emit({ isIntersecting: false, intersectionRatio: 0 })
  assert.deepEqual(controller.getState(), {
    activeStepIndex: 1,
    isCycleRunning: false,
    stepStates: [
      { stepState: 'inactive', imageState: 'inactive', ringActive: false, calloutsActive: false },
      { stepState: 'active', imageState: 'active', ringActive: true, calloutsActive: false },
      { stepState: 'inactive', imageState: 'inactive', ringActive: false, calloutsActive: false },
      { stepState: 'inactive', imageState: 'inactive', ringActive: false, calloutsActive: false },
    ],
  })
  controller.handleAnimationEnd({ animationName: 'how-step-progress' })
  assert.equal(controller.getState().activeStepIndex, 1)
  observer.emit({ isIntersecting: true, intersectionRatio: 0.75 })
  assert.equal(controller.getState().isCycleRunning, true)
  assert.equal(controller.getState().activeStepIndex, 1)

  controller.cleanup()
})

test('How progression advances exactly once for each matching animation end and loops', async () => {
  const { createHowItWorksProgressionController } = await importMotionModel()
  const browser = createHowProgressionBrowserDoubles()
  const controller = createHowItWorksProgressionController({
    target: { id: 'how-it-works' },
    stepCount: 4,
    matchMedia: browser.matchMedia,
    Observer: browser.ObserverDouble,
  })
  browser.observers[0].emit({ isIntersecting: true, intersectionRatio: 1 })

  controller.handleAnimationEnd({ animationName: 'another-animation' })
  assert.equal(controller.getState().activeStepIndex, 0)
  for (const expectedIndex of [1, 2, 3, 0]) {
    controller.handleAnimationEnd({ animationName: 'how-step-progress' })
    assert.equal(controller.getState().activeStepIndex, expectedIndex)
  }

  controller.cleanup()
})

test('How progression pins Step 01 and disables cycling when reduced motion turns on', async () => {
  const { createHowItWorksProgressionController } = await importMotionModel()
  const browser = createHowProgressionBrowserDoubles()
  const controller = createHowItWorksProgressionController({
    target: { id: 'how-it-works' },
    stepCount: 4,
    matchMedia: browser.matchMedia,
    Observer: browser.ObserverDouble,
  })
  browser.observers[0].emit({ isIntersecting: true, intersectionRatio: 1 })
  controller.handleAnimationEnd({ animationName: 'how-step-progress' })
  controller.handleAnimationEnd({ animationName: 'how-step-progress' })
  assert.equal(controller.getState().activeStepIndex, 2)

  browser.preference.setMatches(true)
  assert.equal(controller.getState().isCycleRunning, false)
  assert.equal(controller.getState().activeStepIndex, 0)
  assert.equal(controller.getState().stepStates[0].stepState, 'active')
  controller.handleAnimationEnd({ animationName: 'how-step-progress' })
  assert.equal(controller.getState().activeStepIndex, 0)

  controller.cleanup()
})

test('How progression cleanup is StrictMode-safe across setup, cleanup, and remount', async () => {
  const { createHowItWorksProgressionController } = await importMotionModel()
  const browser = createHowProgressionBrowserDoubles()
  const target = { id: 'how-it-works' }
  const firstStates = []
  const first = createHowItWorksProgressionController({
    target,
    stepCount: 4,
    matchMedia: browser.matchMedia,
    Observer: browser.ObserverDouble,
    onStateChange: (state) => firstStates.push(state),
  })
  first.cleanup()

  assert.equal(browser.observers[0].disconnected, true)
  assert.equal(browser.preferenceListeners.size, 0)

  const secondStates = []
  const second = createHowItWorksProgressionController({
    target,
    stepCount: 4,
    matchMedia: browser.matchMedia,
    Observer: browser.ObserverDouble,
    onStateChange: (state) => secondStates.push(state),
  })
  assert.equal(browser.observers.length, 2)
  assert.equal(browser.preferenceListeners.size, 1)

  const firstStateCountAfterCleanup = firstStates.length
  browser.observers[0].emit({ isIntersecting: true, intersectionRatio: 1 })
  first.handleAnimationEnd({ animationName: 'how-step-progress' })
  assert.equal(firstStates.length, firstStateCountAfterCleanup)

  browser.observers[1].emit({ isIntersecting: true, intersectionRatio: 1 })
  second.handleAnimationEnd({ animationName: 'how-step-progress' })
  assert.equal(second.getState().activeStepIndex, 1)
  assert.equal(secondStates.at(-1).activeStepIndex, 1)

  second.cleanup()
  second.cleanup()
  assert.equal(browser.observers[1].disconnected, true)
  assert.equal(browser.preferenceListeners.size, 0)
})

test('How It Works renders Step 01 as the single synchronized reduced-motion state', async () => {
    const { HowItWorks } = await import('../src/Site.jsx')
    assert.equal(typeof HowItWorks, 'function')
    const markup = renderToStaticMarkup(React.createElement(HowItWorks, { onPreOrder() {} }))
    assert.ok(markup.includes('data-how-cycle="paused"'))
    assert.ok(markup.includes('--how-step-duration:4200ms'))
    assert.equal((markup.match(/data-step-state="active"/g) ?? []).length, 2)
    assert.equal((markup.match(/aria-current="step"/g) ?? []).length, 1)
    assert.equal((markup.match(/how__callouts--active/g) ?? []).length, 1)
    assert.ok(markup.includes('how__image') && markup.includes('data-step-state="inactive"'))
})

test('How images crossfade without moving rows and the active ring uses the DS token', async () => {
  const [appCss, motionCss] = await Promise.all([
    readFile(new URL('../src/app.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/motion.css', import.meta.url), 'utf8'),
  ])
  const css = `${appCss}\n${motionCss}`

  assert.match(css, /\.how__image\[data-step-state='active'\][^{]*\{[^}]*opacity:\s*1;[^}]*transform:\s*scale\(1\);[^}]*transition-duration:\s*var\(--ds-motion-image-crossfade\);/s)
  assert.match(css, /\.how__image\[data-step-state='inactive'\][^{]*\{[^}]*opacity:\s*0;[^}]*transform:\s*scale\(1\.03\);/s)
  assert.match(css, /\.how__image-stack\.motion-parallax__image\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/s)
  assert.match(css, /\.how-step--active \.how-step__progress-value\s*\{[^}]*stroke:\s*var\(--ds-color-action-active\);/s)
  assert.match(css, /\.how-step--active > \[data-type-role='number-small'\]\s*\{[^}]*color:\s*var\(--ds-color-action-active\);/s)
  assert.match(css, /\.how\[data-how-cycle='paused'\] \.how-step--active \.how-step__progress-value\s*\{[^}]*animation-play-state:\s*paused;/s)
  assert.doesNotMatch(css, /\.how-step(?:--active)?\s*\{[^}]*(?:transform|translate|margin-(?:top|right|bottom|left))\s*:/s)
})

test('How media and rows render independent entrance phases without changing row geometry', async () => {
    const { HowItWorks } = await import('../src/Site.jsx')
    const markup = renderToStaticMarkup(React.createElement(HowItWorks, { onPreOrder() {} }))
    const motionCss = await readFile(new URL('../src/motion.css', import.meta.url), 'utf8')

    assert.match(markup, /class="how__media motion-parallax"[^>]+data-how-entrance="media"/)
    assert.match(markup, /<h2[^>]+data-how-entrance="heading"[^>]+data-motion-heading="true"[^>]+data-motion-heading-mode="coherent"/)
    assert.match(markup, /class="how__support"[^>]+data-how-entrance="support"/)
    assert.doesNotMatch(markup, /class="how__support"[^>]+data-motion-slide/)
    assert.equal((markup.match(/class="how-step(?: how-step--active)?"[^>]+data-how-entrance="step"/g) ?? []).length, 4)
    assert.deepEqual(
      Array.from(markup.matchAll(/data-how-entrance="step"[^>]+style="--how-step-index:(\d+)"/g), (match) => Number(match[1])),
      [0, 1, 2, 3],
    )
    assert.doesNotMatch(markup, /class="how__steps"[^>]+data-motion-slide/)

    assert.match(motionCss, /html\.motion-ready \.how \[data-how-entrance='media'\]\s*\{[^}]*opacity:\s*0;[^}]*transform:\s*translate3d\(0,\s*-24px,\s*0\);/s)
    assert.match(motionCss, /html\.motion-ready\.motion-animate \.how \[data-how-entrance='media'\]\s*\{[^}]*transition:[^;}]*var\(--ds-motion-image\)[^;}]*var\(--ds-motion-ease-premium\)/s)
    assert.match(motionCss, /html\.motion-ready\.motion-animate \.how \[data-how-entrance='heading'\],[\s\S]*?\.how \[data-how-entrance='support'\]\s*\{[^}]*var\(--ds-motion-content\)[^}]*var\(--ds-motion-ease-premium\)/s)
    assert.match(motionCss, /html\.motion-ready\.motion-animate \.how \[data-how-entrance='step'\]\s*\{[^}]*transition:[^;}]*var\(--ds-motion-content\)[^;}]*var\(--ds-motion-ease-premium\);[^}]*transition-delay:\s*calc\(160ms \+ \(var\(--how-step-index\) \* 90ms\)\);/s)
    assert.match(motionCss, /html\.motion-ready \.how\.is-motion-visible \[data-how-entrance\]\s*\{[^}]*opacity:\s*1;[^}]*filter:\s*none;[^}]*transform:\s*translate3d\(0,\s*0,\s*0\);/s)
    assert.doesNotMatch(motionCss, /\.how-step\[data-how-entrance='step'\][^{]*\{[^}]*(?:width|height|top|right|bottom|left|margin|padding):/s)
    assert.match(motionCss, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.how \[data-how-entrance\][^}]*opacity:\s*1\s*!important;[^}]*filter:\s*none\s*!important;[^}]*transform:\s*none\s*!important;/)
})

test('Technology feature phases use 800ms reveals, stay ordered, and complete below 1.8 seconds', async () => {
  const { getTechnologyFeatureRevealTiming } = await importMotionModel()

  assert.deepEqual(getTechnologyFeatureRevealTiming(0), {
    connectorDelayMs: 0,
    iconDelayMs: 120,
    numberDelayMs: 200,
    titleDelayMs: 280,
    bodyDelayMs: 360,
    durationMs: 800,
    completeAtMs: 1160,
  })
  assert.deepEqual(getTechnologyFeatureRevealTiming(5), {
    connectorDelayMs: 600,
    iconDelayMs: 720,
    numberDelayMs: 800,
    titleDelayMs: 880,
    bodyDelayMs: 960,
    durationMs: 800,
    completeAtMs: 1760,
  })
  assert.ok(getTechnologyFeatureRevealTiming(5).completeAtMs < 1800)
})

test('Technology annotation depth pauses for model drag and never consumes viewer pointer events', async () => {
  const { createTechnologyAnnotationDepthController } = await importMotionModel()
  const browser = createTechnologyDepthBrowserDoubles()
  const controller = createTechnologyAnnotationDepthController({
    root: browser.root,
    matchMedia: browser.matchMedia,
    requestFrame: browser.requestFrame,
    cancelFrame: browser.cancelFrame,
  })
  const annotationTarget = { closest: () => null }
  const canvasTarget = { closest: (selector) => selector === '.technology__canvas' ? canvasTarget : null }

  assert.equal(browser.root.dataset.technologyDepth, 'active')
  browser.root.dispatch('pointermove', {
    target: annotationTarget,
    clientX: 300,
    clientY: 50,
  })
  browser.flushFrames()
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-x'), '1.0000')
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-y'), '-1.0000')

  browser.root.dispatch('pointerleave')
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-x'), '1.0000')
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-y'), '-1.0000')
  browser.flushFrames()
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-x'), '0.0000')
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-y'), '0.0000')

  browser.root.dispatch('pointermove', {
    target: annotationTarget,
    clientX: 300,
    clientY: 50,
  })
  browser.flushFrames()

  browser.root.dispatch('pointerdown', {
    target: canvasTarget,
    pointerId: 7,
    preventDefault() { throw new Error('annotation depth must not prevent viewer input') },
    stopPropagation() { throw new Error('annotation depth must not stop viewer input') },
  })
  assert.equal(browser.root.dataset.modelInteracting, 'true')
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-x'), '0.0000')
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-y'), '0.0000')
  browser.root.dispatch('pointermove', {
    target: canvasTarget,
    pointerId: 7,
    clientX: 100,
    clientY: 150,
  })
  browser.flushFrames()
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-x'), '0.0000')
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-y'), '0.0000')

  browser.root.dispatch('pointerup', { target: canvasTarget, pointerId: 7 })
  assert.equal(browser.root.dataset.modelInteracting, 'false')
  controller.cleanup()
})

test('Technology annotation depth is static for touch and reduced motion and cleans up', async () => {
  const { createTechnologyAnnotationDepthController } = await importMotionModel()
  const browser = createTechnologyDepthBrowserDoubles()
  const controller = createTechnologyAnnotationDepthController({
    root: browser.root,
    matchMedia: browser.matchMedia,
    requestFrame: browser.requestFrame,
    cancelFrame: browser.cancelFrame,
  })
  const annotationTarget = { closest: () => null }

  browser.root.dispatch('pointermove', {
    target: annotationTarget,
    pointerType: 'touch',
    clientX: 300,
    clientY: 150,
  })
  browser.flushFrames()
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-x'), '0.0000')
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-y'), '0.0000')

  browser.mediaQueries.get('(prefers-reduced-motion: reduce)').setMatches(true)
  assert.equal(browser.root.dataset.technologyDepth, 'static')
  browser.root.dispatch('pointermove', {
    target: annotationTarget,
    clientX: 300,
    clientY: 50,
  })
  browser.flushFrames()
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-x'), '0.0000')
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-y'), '0.0000')

  controller.cleanup()
  assert.equal(browser.root.listenerCount(), 0)
  assert.equal(browser.mediaQueries.get('(prefers-reduced-motion: reduce)').listenerCount(), 0)
  assert.equal(browser.mediaQueries.get('(hover: hover) and (pointer: fine)').listenerCount(), 0)
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-x'), '')
  assert.equal(browser.root.style.getPropertyValue('--technology-depth-y'), '')
})

test('Technology reveal styles target annotations while leaving viewer media transforms untouched', async () => {
  const motionCss = await readFile(new URL('../src/motion.css', import.meta.url), 'utf8')

  assert.match(motionCss, /\.technology-feature__connector path\s*\{[^}]*stroke-dasharray:\s*1;[^}]*stroke-dashoffset:\s*1;/s)
  assert.match(motionCss, /@keyframes technology-connector-draw\s*\{[^}]*stroke-dashoffset:\s*0;/s)
  assert.match(motionCss, /\.technology\.is-motion-visible \.technology-feature__content > \[data-type-role='body'\]/)
  assert.match(motionCss, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.technology-feature__connector path[\s\S]*stroke-dashoffset:\s*0\s*!important/)
  assert.match(motionCss, /technology-connector-draw var\(--ds-motion-content\)/)
  assert.match(motionCss, /\.technology-feature__icon\s*\{[^}]*transition:[^}]*var\(--ds-motion-content\)/s)
  assert.match(motionCss, /\.technology-feature__number\s*\{[^}]*transition:[^}]*var\(--ds-motion-content\)[^}]*transition-delay:\s*var\(--technology-number-delay\)/s)
  assert.match(motionCss, /\.technology-feature__content > h3\s*\{[^}]*transition:[^}]*var\(--ds-motion-content\)[^}]*transition-delay:\s*var\(--technology-title-delay\)/s)
  assert.match(motionCss, /\.technology-feature__content > \[data-type-role='body'\]\s*\{[^}]*transition:[^}]*var\(--ds-motion-content\)/s)
  assert.doesNotMatch(motionCss, /\.technology__(?:media|canvas|poster)\b/)
})

test('testimonial carousel wraps in both directions and settles one synchronized state after 450ms', async () => {
  const { createTestimonialCarouselController } = await importMotionModel()
  const browser = createTestimonialTimerDoubles()
  const states = []
  const controller = createTestimonialCarouselController({
    length: 3,
    setTimer: browser.setTimer,
    clearTimer: browser.clearTimer,
    onStateChange: (state) => states.push(state),
  })

  controller.move(-1)
  assert.deepEqual(controller.getState(), {
    activeIndex: 2,
    previousIndex: 0,
    direction: 'previous',
    hasTransition: true,
  })
  assert.deepEqual(states.at(-1), controller.getState())
  assert.deepEqual(Array.from(browser.timers.values(), ({ delay }) => delay), [450])

  const firstTimer = Array.from(browser.timers.keys())[0]
  browser.runTimer(firstTimer)
  assert.deepEqual(controller.getState(), {
    activeIndex: 2,
    previousIndex: null,
    direction: 'previous',
    hasTransition: false,
  })

  controller.move(1)
  assert.deepEqual(controller.getState(), {
    activeIndex: 0,
    previousIndex: 2,
    direction: 'next',
    hasTransition: true,
  })
  controller.cleanup()
})

test('testimonial carousel remains functional without motion and cleanup cancels pending work', async () => {
  const { createTestimonialCarouselController } = await importMotionModel()
  const browser = createTestimonialTimerDoubles()
  let reducedMotion = false
  const controller = createTestimonialCarouselController({
    length: 3,
    reducedMotion: () => reducedMotion,
    setTimer: browser.setTimer,
    clearTimer: browser.clearTimer,
  })

  controller.move(1)
  const pendingTimer = Array.from(browser.timers.keys())[0]
  assert.equal(browser.timers.get(pendingTimer).delay, 450)
  reducedMotion = true
  controller.move(1)
  assert.deepEqual(controller.getState(), {
    activeIndex: 2,
    previousIndex: null,
    direction: 'next',
    hasTransition: false,
  })
  assert.equal(browser.timers.size, 0)
  assert.deepEqual(browser.cleared, [pendingTimer])

  reducedMotion = false
  controller.move(-1)
  const cleanupTimer = Array.from(browser.timers.keys())[0]
  controller.cleanup()
  assert.equal(browser.timers.size, 0)
  assert.ok(browser.cleared.includes(cleanupTimer))
  assert.equal(controller.move(1), false)
})

test('rendered testimonial identity and copy share one carousel state with accessible manual controls', async () => {
    const { Testimonial } = await import('../src/Site.jsx')
    assert.equal(typeof Testimonial, 'function')
    const markup = renderToStaticMarkup(React.createElement(Testimonial))

    assert.match(markup, /data-carousel-active-index="0"/)
    assert.match(markup, /data-carousel-previous-index=""/)
    assert.match(markup, /data-carousel-direction="next"/)
    assert.match(markup, /data-carousel-transition="false"/)
    assert.equal((markup.match(/data-carousel-state="active"/g) ?? []).length, 2)
    assert.equal((markup.match(/aria-label="Previous testimonial"/g) ?? []).length, 1)
    assert.equal((markup.match(/aria-label="Next testimonial"/g) ?? []).length, 1)
    assert.doesNotMatch(markup, /aria-label="(?:Previous|Next) testimonial"[^>]*disabled/)
    assert.match(markup, /aria-live="polite"/)
    assert.match(markup, /aria-atomic="true"/)
    assert.match(markup, /Testimonial 1 of 3: DANIEL R\./)
    assert.match(markup, /<blockquote[^>]+data-testimonial-entrance="quote"[^>]+data-motion-heading-mode="coherent"/)
})

test('testimonial motion uses fixed composited geometry, synchronized timing, and image-only zoom', async () => {
  const [appCss, motionCss] = await Promise.all([
    readFile(new URL('../src/app.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/motion.css', import.meta.url), 'utf8'),
  ])
  const testimonialKeyframes = Array.from(appCss.matchAll(/@keyframes testimonial-[^\n]+/g), (match) => match[0]).join('\n')

  assert.match(appCss, /data-carousel-transition='true'[^}]*animation:[^;}]+450ms var\(--ds-motion-ease-premium\)/)
  assert.match(testimonialKeyframes, /testimonial-enter-next[^\n]*blur\(6px\)[^\n]*translate3d\(32px,\s*0,\s*0\)/)
  assert.match(testimonialKeyframes, /testimonial-leave-next[^\n]*blur\(6px\)[^\n]*translate3d\(-32px,\s*0,\s*0\)/)
  assert.match(testimonialKeyframes, /testimonial-enter-previous[^\n]*blur\(6px\)[^\n]*translate3d\(-32px,\s*0,\s*0\)/)
  assert.match(testimonialKeyframes, /testimonial-leave-previous[^\n]*blur\(6px\)[^\n]*translate3d\(32px,\s*0,\s*0\)/)
  assert.doesNotMatch(testimonialKeyframes, /\b(?:width|height|top|right|bottom|left|margin|padding)\s*:/)
  assert.match(appCss, /\.testimonial\.is-motion-visible\s+\.testimonial__identity-state\[data-carousel-state='active'\]\s*>\s*img\s*\{[^}]*animation:\s*testimonial-portrait-settle 450ms var\(--ds-motion-ease-premium\)/s)
  assert.match(appCss, /@keyframes testimonial-portrait-settle[^\n]*scale\(1\.05\)/)
  assert.doesNotMatch(appCss, /\.testimonial__identity-state(?:\[[^\]]+\])*\s*\{[^}]*scale\(/s)

  for (const [part, delay] of [['portrait', 0], ['name', 80], ['role', 140], ['quote', 200], ['support', 290], ['navigation', 380]]) {
    assert.match(motionCss, new RegExp(`\\[data-testimonial-entrance='${part}'\\][^}]*--testimonial-entrance-delay:\\s*${delay}ms`))
  }
  assert.match(motionCss, /html\.motion-ready\.motion-animate \.testimonial \[data-testimonial-entrance\][^{]*\{[^}]*var\(--ds-motion-content\)[^}]*var\(--ds-motion-ease-premium\)/s)
  assert.match(motionCss, /\.testimonial \[data-testimonial-entrance='quote'\] \.motion-heading__line-inner\s*\{[^}]*clip-path:\s*none;[^}]*transform:\s*none;/s)
  assert.match(motionCss, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\[data-testimonial-entrance\][^}]*opacity:\s*1\s*!important;[^}]*filter:\s*none\s*!important;[^}]*transform:\s*none\s*!important;/)
  assert.match(appCss, /\.testimonial\s*\{[^}]*min-height:\s*794px;/s)
  assert.match(appCss, /\.testimonial__identity\s*\{[^}]*grid-column:\s*1\s*\/\s*span\s*3;/s)
  assert.match(appCss, /\.testimonial__quote\s*\{[^}]*grid-column:\s*4\s*\/\s*-1;/s)
})

test('Hero depth delivery switches atomically and treats an image error as terminal', async () => {
  const {
    HERO_LAYER_INITIAL_STATE,
    getCompleteHeroImageStatus,
    heroLayerPairIsReady,
    transitionHeroLayerState,
  } = await importMotionModel()

  assert.deepEqual(HERO_LAYER_INITIAL_STATE, { sky: 'pending', foreground: 'pending' })
  assert.equal(heroLayerPairIsReady(HERO_LAYER_INITIAL_STATE), false)
  assert.equal(typeof getCompleteHeroImageStatus, 'function')
  assert.equal(getCompleteHeroImageStatus({ complete: false, naturalWidth: 0 }), null)
  assert.equal(getCompleteHeroImageStatus({ complete: true, naturalWidth: 6668 }), 'loaded')
  assert.equal(getCompleteHeroImageStatus({ complete: true, naturalWidth: 0 }), 'error')

  const skyLoaded = transitionHeroLayerState(HERO_LAYER_INITIAL_STATE, 'sky', 'loaded')
  assert.deepEqual(skyLoaded, { sky: 'loaded', foreground: 'pending' })
  assert.equal(heroLayerPairIsReady(skyLoaded), false)

  const pairLoaded = transitionHeroLayerState(skyLoaded, 'foreground', 'loaded')
  assert.equal(heroLayerPairIsReady(pairLoaded), true)

  const foregroundFailed = transitionHeroLayerState(skyLoaded, 'foreground', 'error')
  assert.equal(heroLayerPairIsReady(foregroundFailed), false)
  assert.strictEqual(
    transitionHeroLayerState(foregroundFailed, 'foreground', 'loaded'),
    foregroundFailed,
    'a late load must not revive a failed layered pair',
  )
})

test('Hero motion preserves normal document flow and fixed depth-layer boxes', async () => {
  const [site, appCss, motionCss] = await Promise.all([
    readFile(new URL('../src/site/InteractiveSections.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/motion.css', import.meta.url), 'utf8'),
  ])

  assert.match(site, /data-depth-layer="sky"/)
  assert.match(site, /data-depth-layer="foreground"/)
  assert.match(site, /<CountUpMetric value=\{outcome\.value\}/)
  assert.doesNotMatch(site, /event\.currentTarget\.hidden\s*=\s*true/)
  assert.doesNotMatch(appCss, /\.hero\s*\{[^}]*position:\s*sticky/s)
  assert.match(appCss, /\.hero__depth-layer\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*overflow:\s*hidden;/s)
  assert.match(motionCss, /\.hero__depth-layer--sky\s*\{[^}]*translate3d\(var\(--hero-sky-x,\s*0\),\s*var\(--hero-sky-y,\s*0\),\s*0\)\s*scale\(1\.03\)/s)
  assert.match(motionCss, /\.hero__depth-layer--foreground\s*\{[^}]*translate3d\(var\(--hero-foreground-x,\s*0\),\s*var\(--hero-foreground-y,\s*0\),\s*0\)/s)
})

test('Hero uses one coherent heading reveal and one synchronized 1350ms outcome count contract', async () => {
    const [{ HeroOutcomeMetrics }, { MotionHeading }] = await Promise.all([
      import('../src/Site.jsx'),
      import('../src/motion.jsx'),
    ])
    assert.equal(typeof HeroOutcomeMetrics, 'function')

    const headingMarkup = renderToStaticMarkup(React.createElement(MotionHeading, {
      as: 'h1',
      role: 'display',
      lines: ['MEET', 'NEW', 'MO/GO'],
      motionMode: 'coherent',
    }))
    const outcomesMarkup = renderToStaticMarkup(React.createElement(HeroOutcomeMetrics, {
      outcomes: [
        { label: 'REDUCTION IN LEG STRAIN', value: '30%' },
        { label: 'MORE ENDURANCE ON EVERY HIKE', value: '2.5x' },
      ],
    }))

    assert.match(headingMarkup, /<h1[^>]+data-motion-heading="true"[^>]+data-motion-heading-mode="coherent"/)
    assert.match(outcomesMarkup, /class="hero__outcomes"[^>]+data-count-group="hero-outcomes"[^>]+data-count-ready="false"/)
    assert.equal((outcomesMarkup.match(/data-count-duration-ms="1350"/g) ?? []).length, 2)
    assert.match(outcomesMarkup, /count-up-metric__measure" aria-hidden="true">30%/)
    assert.match(outcomesMarkup, /count-up-metric__measure" aria-hidden="true">2\.5x/)
    assert.match(outcomesMarkup, /count-up-metric__reserve" aria-hidden="true">00%/)
    assert.match(outcomesMarkup, /count-up-metric__reserve" aria-hidden="true">0\.0x/)
    assert.match(outcomesMarkup, /count-up-metric__value" aria-hidden="true">0%/)
    assert.match(outcomesMarkup, /count-up-metric__value" aria-hidden="true">0\.0x/)
})

test('header mode respects hero precedence and scroll thresholds', async () => {
  const { resolveHeaderMode } = await importMotionModel()

  assert.equal(resolveHeaderMode({ introComplete: false, withinHero: false, direction: 'up', directionDistance: 56 }), 'hero')
  assert.equal(resolveHeaderMode({ introComplete: true, withinHero: true, direction: 'down', directionDistance: 24 }), 'hero')
  assert.equal(resolveHeaderMode({ introComplete: true, withinHero: false, direction: 'up', directionDistance: 56 }), 'compact')
  assert.equal(resolveHeaderMode({ introComplete: true, withinHero: false, direction: 'down', directionDistance: 24 }), 'hidden')
  assert.equal(resolveHeaderMode({ introComplete: true, withinHero: false, direction: 'up', directionDistance: 55, currentMode: 'hero' }), 'dormant')
})

test('header uses stable direction thresholds outside the hero', async () => {
  const { resolveHeaderMode } = await importMotionModel()

  assert.equal(resolveHeaderMode({ introComplete: false, withinHero: true, direction: 'down', directionDistance: 80 }), 'hero')
  assert.equal(resolveHeaderMode({ introComplete: true, withinHero: false, direction: 'down', directionDistance: 23, currentMode: 'hero' }), 'dormant')
  assert.equal(resolveHeaderMode({ introComplete: true, withinHero: false, direction: 'down', directionDistance: 24, currentMode: 'dormant' }), 'hidden')
  assert.equal(resolveHeaderMode({ introComplete: true, withinHero: false, direction: 'up', directionDistance: 56, currentMode: 'hidden' }), 'compact')
})

test('compact header is a full-width dark bar rather than a centered pill', async () => {
  const [motionCss, designSystemCss] = await Promise.all([
    readFile(new URL('../src/motion.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/design-system/styles.css', import.meta.url), 'utf8'),
  ])

  assert.match(motionCss, /\.site-header\s*\{[^}]*inset-inline:\s*0;[^}]*width:\s*100%;[^}]*transition:\s*transform\s+[^,;]+,\s*opacity\s+[^;]+;/s)
  assert.match(motionCss, /\.site-header--compact\s*\{[^}]*top:\s*0;[^}]*background:\s*var\(--ds-color-ink\);/s)
  assert.doesNotMatch(motionCss, /\.site-header--compact\s*\{[^}]*\b(?:left|right|width)\s*:/s)
  assert.doesNotMatch(motionCss, /\.site-header--compact\s+\.ds-site-header/)
  assert.doesNotMatch(motionCss, /\.site-header\s*\{[^}]*transition:[^;]*(?:top|left|right|width|padding|border-radius|background-color|box-shadow|color)/s)
  assert.match(designSystemCss, /\.ds-site-header--compact\s*\{[^}]*border-radius:\s*0;[^}]*color:\s*var\(--ds-color-surface\);[^}]*background:\s*var\(--ds-color-ink\);/s)
  assert.match(designSystemCss, /\.ds-site-header--compact\s*\{[^}]*padding-block:\s*var\(--ds-space-s\);/s)
  assert.doesNotMatch(designSystemCss, /\.ds-site-header--compact\s*\{[^}]*--ds-theme-border:/s)
})

test('compact SiteHeader uses the same constrained rail as the Hero header at tablet and mobile breakpoints', async () => {
  const css = await readFile(new URL('../src/design-system/styles.css', import.meta.url), 'utf8')
  const compactClasses = new Set(['ds-site-header', 'ds-site-header--compact'])
  const standardClasses = new Set(['ds-site-header'])

  for (const viewportWidth of [1024, 390]) {
    assert.equal(computeClassCascade(css, {
      classes: compactClasses,
      property: 'width',
      viewportWidth,
    }), computeClassCascade(css, {
      classes: standardClasses,
      property: 'width',
      viewportWidth,
    }))
  }
  assert.equal(computeClassCascade(css, {
    classes: standardClasses,
    property: 'width',
    viewportWidth: 1024,
  }), 'calc(100% - var(--ds-space-l) * 2)')
  assert.equal(computeClassCascade(css, {
    classes: standardClasses,
    property: 'width',
    viewportWidth: 390,
  }), 'calc(100% - var(--ds-space-l))')
  assert.equal(computeClassCascade(css, {
    classes: compactClasses,
    property: 'grid-template-columns',
    viewportWidth: 1024,
  }), '104px minmax(0, 1fr) auto')
  assert.equal(computeClassCascade(css, {
    classes: compactClasses,
    property: 'grid-template-columns',
    viewportWidth: 390,
  }), '1fr auto')
})

test('compact SiteHeader declares the inverse design-system theme for its dark surface', async () => {
    const { SiteHeader } = await import('../src/design-system/index.jsx')
    const markup = renderToStaticMarkup(React.createElement(SiteHeader, {
      logo: '/logo.svg',
      basketIcon: '/basket.svg',
      navigation: [],
      state: 'compact',
    }))

    assert.match(markup, /data-ds-component="site-header"[^>]+data-ds-variant="compact"[^>]+data-ds-theme="inverse"/)
})

test('the settled Hero metric rows use the catalogue filter fingerprint', async () => {
  const motionCss = await readFile(new URL('../src/motion.css', import.meta.url), 'utf8')

  assert.match(motionCss, /html\.motion-ready \.hero\.is-motion-visible \[data-motion-group='specs'\] \.ds-metric-row\s*\{[^}]*opacity:\s*1;[^}]*filter:\s*none;[^}]*transform:\s*translate3d\(0,\s*0,\s*0\);/s)
})

test('the shared motion timing provides the approved durations', async () => {
  const { MOTION_TIMING } = await importMotionModel()

  assert.deepEqual(MOTION_TIMING, {
    fast: 200,
    ui: 300,
    content: 800,
    image: 750,
    imageCrossfade: 700,
    heroCount: 1350,
    stagger: 90,
    technologyStagger: 120,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  })
})

test('the design system owns the approved motion values', async () => {
  const css = await readFile(new URL('../src/design-system/styles.css', import.meta.url), 'utf8')

  assert.match(css, /--ds-motion-fast:\s*200ms/)
  assert.match(css, /--ds-motion-ui:\s*300ms/)
  assert.match(css, /--ds-motion-content:\s*800ms/)
  assert.match(css, /--ds-motion-image:\s*750ms/)
  assert.match(css, /--ds-motion-image-crossfade:\s*700ms/)
  assert.match(css, /--ds-motion-hero-count:\s*1350ms/)
  assert.match(css, /--ds-motion-ease-premium:\s*cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/)
})

test('heading and supporting-copy entrances consume the shared 800ms content token', async () => {
  const css = await readFile(new URL('../src/motion.css', import.meta.url), 'utf8')

  assert.match(css, /\[data-motion-heading\] \.motion-heading__line-inner\s*\{[^}]*transition:\s*clip-path var\(--ds-motion-content\)[^;}]*transform var\(--ds-motion-content\)/s)
  assert.match(css, /\[data-motion-slide\]\s*\{[^}]*transition-duration:\s*var\(--ds-motion-content\);/s)
})

test('reduced motion exposes settled content immediately without decorative effects', async () => {
  const [motionCss, appCss, designSystemCss] = await Promise.all([
    readFile(new URL('../src/motion.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/app.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/design-system/styles.css', import.meta.url), 'utf8'),
  ])
  const reducedMotionCss = motionCss.slice(motionCss.indexOf('@media (prefers-reduced-motion: reduce)'))
  const immediateStateRule = reducedMotionCss.match(
    /\[data-motion-group\],[\s\S]*?\.testimonial__identity-state > img\s*\{([^}]*)\}/,
  )?.[1] ?? ''

  assert.match(immediateStateRule, /animation:\s*none\s*!important/)
  assert.match(immediateStateRule, /transition:\s*none\s*!important/)
  assert.match(immediateStateRule, /transform:\s*none\s*!important/)
  assert.match(immediateStateRule, /filter:\s*none\s*!important/)
  assert.match(immediateStateRule, /opacity:\s*1\s*!important/)
  assert.match(reducedMotionCss, /technology-feature__connector path[\s\S]*stroke-dashoffset:\s*0\s*!important/)
  assert.match(reducedMotionCss, /\.count-up-metric__measure\s*\{[^}]*visibility:\s*visible\s*!important;/s)
  assert.match(reducedMotionCss, /\.count-up-metric__value\s*\{[^}]*visibility:\s*hidden\s*!important;/s)
  assert.match(motionCss, /html\.qa-settled \.count-up-metric__measure\s*\{[^}]*visibility:\s*visible\s*!important;/s)
  assert.match(motionCss, /html\.qa-settled \.count-up-metric__value\s*\{[^}]*visibility:\s*hidden\s*!important;/s)
  assert.match(reducedMotionCss, /\.testimonial__state\s*\{[^}]*animation:\s*none\s*!important;[^}]*transform:\s*none\s*!important;/s)
  assert.match(reducedMotionCss, /\.testimonial__state\[data-carousel-state='active'\]\s*\{[^}]*opacity:\s*1\s*!important;/s)
  assert.match(reducedMotionCss, /\.testimonial__state:not\(\[data-carousel-state='active'\]\)\s*\{[^}]*opacity:\s*0\s*!important;/s)
  assert.match(appCss.slice(appCss.indexOf('@media (prefers-reduced-motion: reduce)')), /how-step__progress-value[\s\S]*animation:\s*none\s*!important/)
  assert.match(designSystemCss.slice(designSystemCss.indexOf('@media (prefers-reduced-motion: reduce)')), /button__label-current[\s\S]*animation:\s*none\s*!important/)

  const coarsePointerQuery = '@media (prefers-reduced-motion: no-preference) and (hover: none), (prefers-reduced-motion: no-preference) and (pointer: coarse)'
  const coarsePointerCss = motionCss.slice(motionCss.indexOf(coarsePointerQuery))
  assert.notEqual(motionCss.indexOf(coarsePointerQuery), -1)
  assert.match(coarsePointerCss, /hero__depth-layer--sky\s*\{[^}]*scale\(1\.03\)/s)
  assert.match(coarsePointerCss, /footer__background\s*\{[^}]*scale\(1\.03\)/s)
  assert.match(coarsePointerCss, /\[data-technology-depth\]\s*\{[^}]*transform:\s*none\s*!important/s)
})

test('motion styles never animate layout dimensions', async () => {
  const css = await readFile(new URL('../src/motion.css', import.meta.url), 'utf8')

  assert.doesNotMatch(
    css,
    /transition(?:-property)?:\s*[^;]*(?:width|height|top|left|right|bottom|margin|padding)/,
  )
  assert.doesNotMatch(
    css,
    /@keyframes[^}]*\{[^}]*\b(?:width|height|top|left|right|bottom|margin|padding)\s*:/s,
  )
})
