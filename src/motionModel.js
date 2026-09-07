export const MOTION_TIMING = Object.freeze({
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

export const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))

export function normalizePointer(rect, clientX, clientY) {
  return {
    x: clamp(((clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
    y: clamp(((clientY - rect.top) / rect.height) * 2 - 1, -1, 1),
  }
}

export const mapDepth = (point, limits) => ({ x: point.x * limits.x, y: point.y * limits.y })
export const easeOutCubic = (progress) => {
  const normalized = clamp(progress, 0, 1)
  return 1 - ((1 - normalized) ** 3)
}

export const easeInOutSine = (progress) => {
  const normalized = clamp(progress, 0, 1)
  return (1 - Math.cos(Math.PI * normalized)) / 2
}
export const countMetric = (progress, target, precision = 0) => Number(
  (clamp(progress, 0, 1) * target).toFixed(precision),
)

export function createPointerDepthController({
  root,
  layers,
  variablePrefix,
  stateAttribute,
  matchMedia = typeof globalThis.matchMedia === 'function'
    ? globalThis.matchMedia.bind(globalThis)
    : undefined,
  requestFrame = typeof globalThis.requestAnimationFrame === 'function'
    ? globalThis.requestAnimationFrame.bind(globalThis)
    : (callback) => callback(),
  cancelFrame = typeof globalThis.cancelAnimationFrame === 'function'
    ? globalThis.cancelAnimationFrame.bind(globalThis)
    : () => {},
}) {
  if (!root) return { cleanup() {} }

  const entries = Object.entries(layers)
  const reducedMotion = matchMedia?.('(prefers-reduced-motion: reduce)')
  const finePointer = matchMedia?.('(hover: hover) and (pointer: fine)')
  const current = Object.fromEntries(entries.map(([name]) => [name, { x: 0, y: 0 }]))
  const target = Object.fromEntries(entries.map(([name]) => [name, { x: 0, y: 0 }]))
  const dataAttribute = stateAttribute?.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
  let frame = 0
  let disposed = false

  const propertyName = (name, axis) => `--${variablePrefix}-${name}-${axis}`
  const write = (name, point) => {
    root.style.setProperty(propertyName(name, 'x'), `${point.x.toFixed(2)}px`)
    root.style.setProperty(propertyName(name, 'y'), `${point.y.toFixed(2)}px`)
  }
  const stopFrame = () => {
    if (frame) cancelFrame(frame)
    frame = 0
  }
  const tick = () => {
    frame = 0
    let moving = false
    entries.forEach(([name]) => {
      const next = current[name]
      next.x += (target[name].x - next.x) * 0.14
      next.y += (target[name].y - next.y) * 0.14
      if (Math.abs(target[name].x - next.x) < 0.01) next.x = target[name].x
      else moving = true
      if (Math.abs(target[name].y - next.y) < 0.01) next.y = target[name].y
      else moving = true
      write(name, next)
    })
    if (moving && !disposed) frame = requestFrame(tick)
  }
  const requestTick = () => {
    if (!frame) frame = requestFrame(tick)
  }
  const reset = (immediate = false) => {
    entries.forEach(([name]) => {
      target[name].x = 0
      target[name].y = 0
      if (immediate) {
        current[name].x = 0
        current[name].y = 0
        write(name, current[name])
      }
    })
    if (immediate) stopFrame()
    else requestTick()
  }
  const depthEnabled = () => Boolean(finePointer?.matches && !reducedMotion?.matches)
  const syncCapability = () => {
    if (stateAttribute) root.dataset[stateAttribute] = depthEnabled() ? 'active' : 'static'
    if (!depthEnabled()) reset(true)
  }
  const updatePointer = (event) => {
    if (event.pointerType === 'touch' || !depthEnabled()) {
      reset(true)
      return
    }
    const point = normalizePointer(root.getBoundingClientRect(), event.clientX, event.clientY)
    entries.forEach(([name, limits]) => {
      const mapped = mapDepth(point, limits)
      target[name].x = mapped.x
      target[name].y = mapped.y
    })
    requestTick()
  }
  const leavePointer = () => reset()

  entries.forEach(([name]) => write(name, current[name]))
  syncCapability()
  root.addEventListener('pointermove', updatePointer, { passive: true })
  root.addEventListener('pointerleave', leavePointer)
  reducedMotion?.addEventListener?.('change', syncCapability)
  finePointer?.addEventListener?.('change', syncCapability)

  return {
    cleanup() {
      if (disposed) return
      disposed = true
      stopFrame()
      root.removeEventListener('pointermove', updatePointer)
      root.removeEventListener('pointerleave', leavePointer)
      reducedMotion?.removeEventListener?.('change', syncCapability)
      finePointer?.removeEventListener?.('change', syncCapability)
      entries.forEach(([name]) => {
        root.style.removeProperty(propertyName(name, 'x'))
        root.style.removeProperty(propertyName(name, 'y'))
      })
      if (dataAttribute) root.removeAttribute(`data-${dataAttribute}`)
    },
  }
}

const TECHNOLOGY_FEATURE_STAGGER_MS = 120
const TECHNOLOGY_FEATURE_DURATION_MS = 800
const TECHNOLOGY_FEATURE_PHASE_DELAY_MS = Object.freeze({
  connector: 0,
  icon: 120,
  number: 200,
  title: 280,
  body: 360,
})

export function getTechnologyFeatureRevealTiming(index) {
  const featureDelay = index * TECHNOLOGY_FEATURE_STAGGER_MS
  return {
    connectorDelayMs: featureDelay + TECHNOLOGY_FEATURE_PHASE_DELAY_MS.connector,
    iconDelayMs: featureDelay + TECHNOLOGY_FEATURE_PHASE_DELAY_MS.icon,
    numberDelayMs: featureDelay + TECHNOLOGY_FEATURE_PHASE_DELAY_MS.number,
    titleDelayMs: featureDelay + TECHNOLOGY_FEATURE_PHASE_DELAY_MS.title,
    bodyDelayMs: featureDelay + TECHNOLOGY_FEATURE_PHASE_DELAY_MS.body,
    durationMs: TECHNOLOGY_FEATURE_DURATION_MS,
    completeAtMs: featureDelay + TECHNOLOGY_FEATURE_PHASE_DELAY_MS.body + TECHNOLOGY_FEATURE_DURATION_MS,
  }
}

const TESTIMONIAL_TRANSITION_MS = 450

export function createTestimonialCarouselController({
  length,
  initialIndex = 0,
  reducedMotion = () => false,
  setTimer = (callback, delay) => globalThis.setTimeout(callback, delay),
  clearTimer = (timer) => globalThis.clearTimeout(timer),
  onStateChange = () => {},
}) {
  let disposed = false
  let transitionTimer = null
  let state = {
    activeIndex: initialIndex,
    previousIndex: null,
    direction: 'next',
    hasTransition: false,
  }

  const snapshot = () => ({ ...state })
  const publish = () => onStateChange(snapshot())
  const cancelTransitionTimer = () => {
    if (transitionTimer == null) return
    clearTimer(transitionTimer)
    transitionTimer = null
  }
  const settle = () => {
    transitionTimer = null
    if (disposed || !state.hasTransition) return
    state = { ...state, previousIndex: null, hasTransition: false }
    publish()
  }

  return {
    getState: snapshot,
    move(delta) {
      if (disposed || !Number.isInteger(length) || length < 1 || delta === 0) return false
      cancelTransitionTimer()
      const previousIndex = state.activeIndex
      const activeIndex = (previousIndex + delta + length) % length
      const hasTransition = !reducedMotion()
      state = {
        activeIndex,
        previousIndex: hasTransition ? previousIndex : null,
        direction: delta > 0 ? 'next' : 'previous',
        hasTransition,
      }
      publish()
      if (hasTransition) transitionTimer = setTimer(settle, TESTIMONIAL_TRANSITION_MS)
      return true
    },
    cleanup() {
      if (disposed) return
      disposed = true
      cancelTransitionTimer()
    },
  }
}

export function createTechnologyAnnotationDepthController({
  root,
  matchMedia = typeof globalThis.matchMedia === 'function'
    ? globalThis.matchMedia.bind(globalThis)
    : undefined,
  requestFrame = typeof globalThis.requestAnimationFrame === 'function'
    ? globalThis.requestAnimationFrame.bind(globalThis)
    : (callback) => callback(),
  cancelFrame = typeof globalThis.cancelAnimationFrame === 'function'
    ? globalThis.cancelAnimationFrame.bind(globalThis)
    : () => {},
}) {
  if (!root) return { cleanup() {} }

  const reducedMotion = matchMedia?.('(prefers-reduced-motion: reduce)')
  const finePointer = matchMedia?.('(hover: hover) and (pointer: fine)')
  const current = { x: 0, y: 0 }
  const target = { x: 0, y: 0 }
  let frame = 0
  let disposed = false

  const writeDepth = () => {
    root.style.setProperty('--technology-depth-x', current.x.toFixed(4))
    root.style.setProperty('--technology-depth-y', current.y.toFixed(4))
  }
  const stopFrame = () => {
    if (frame) cancelFrame(frame)
    frame = 0
  }
  const tick = () => {
    frame = 0
    current.x += (target.x - current.x) * 0.14
    current.y += (target.y - current.y) * 0.14
    const movingX = Math.abs(target.x - current.x) >= 0.01
    const movingY = Math.abs(target.y - current.y) >= 0.01
    if (!movingX) current.x = target.x
    if (!movingY) current.y = target.y
    writeDepth()
    if ((movingX || movingY) && !disposed) frame = requestFrame(tick)
  }
  const requestTick = () => {
    if (!frame) frame = requestFrame(tick)
  }
  const reset = (immediate = false) => {
    target.x = 0
    target.y = 0
    if (immediate) {
      stopFrame()
      current.x = 0
      current.y = 0
      writeDepth()
      return
    }
    requestTick()
  }
  const depthEnabled = () => Boolean(
    finePointer?.matches
    && !reducedMotion?.matches
    && root.dataset.modelInteracting !== 'true',
  )
  const syncCapability = () => {
    root.dataset.technologyDepth = finePointer?.matches && !reducedMotion?.matches
      ? 'active'
      : 'static'
    if (!depthEnabled()) reset(true)
  }
  const isModelTarget = (event) => Boolean(event?.target?.closest?.('.technology__canvas'))
  const updatePointer = (event) => {
    if (event.pointerType === 'touch' || !depthEnabled()) {
      reset(true)
      return
    }
    const point = normalizePointer(root.getBoundingClientRect(), event.clientX, event.clientY)
    target.x = point.x
    target.y = point.y
    requestTick()
  }
  const startModelInteraction = (event) => {
    if (!isModelTarget(event)) return
    root.dataset.modelInteracting = 'true'
    reset(true)
  }
  const endModelInteraction = (event) => {
    if (!isModelTarget(event)) return
    root.dataset.modelInteracting = 'false'
  }
  const listeners = [
    ['pointermove', updatePointer, { passive: true }],
    ['pointerleave', () => reset()],
    ['pointerdown', startModelInteraction],
    ['pointerup', endModelInteraction],
    ['pointercancel', endModelInteraction],
  ]

  root.dataset.modelInteracting = 'false'
  writeDepth()
  syncCapability()
  listeners.forEach(([type, listener, options]) => root.addEventListener(type, listener, options))
  reducedMotion?.addEventListener?.('change', syncCapability)
  finePointer?.addEventListener?.('change', syncCapability)

  return {
    cleanup() {
      if (disposed) return
      disposed = true
      stopFrame()
      listeners.forEach(([type, listener, options]) => root.removeEventListener(type, listener, options))
      reducedMotion?.removeEventListener?.('change', syncCapability)
      finePointer?.removeEventListener?.('change', syncCapability)
      root.style.removeProperty('--technology-depth-x')
      root.style.removeProperty('--technology-depth-y')
      root.removeAttribute('data-model-interacting')
      root.removeAttribute('data-technology-depth')
    },
  }
}

export const HERO_LAYER_INITIAL_STATE = Object.freeze({ sky: 'pending', foreground: 'pending' })

export function transitionHeroLayerState(current, layer, status) {
  if (!(layer in HERO_LAYER_INITIAL_STATE) || !['loaded', 'error'].includes(status)) return current
  if (current[layer] === 'error' || current[layer] === status) return current
  return { ...current, [layer]: status }
}

export function getCompleteHeroImageStatus(image) {
  if (!image?.complete) return null
  return image.naturalWidth > 0 ? 'loaded' : 'error'
}

export const heroLayerPairIsReady = ({ sky, foreground }) => sky === 'loaded' && foreground === 'loaded'

export const nextLoopIndex = (index, length) => (index + 1) % length
export const shouldRunLoop = ({ inView, reducedMotion }) => inView && !reducedMotion

export const HOW_IT_WORKS_INTERSECTION_THRESHOLD = 0.2

export function observeHowSectionVisibility(target, onVisibilityChange, Observer = globalThis.IntersectionObserver) {
  if (!target) return () => {}
  if (typeof Observer !== 'function') {
    onVisibilityChange(true)
    return () => {}
  }

  const observer = new Observer(([entry]) => {
    const visible = Boolean(
      entry?.isIntersecting && entry.intersectionRatio >= HOW_IT_WORKS_INTERSECTION_THRESHOLD,
    )
    onVisibilityChange(visible)
  }, { threshold: HOW_IT_WORKS_INTERSECTION_THRESHOLD })
  observer.observe(target)
  return () => observer.disconnect()
}

export function buildHowStepStates(activeStepIndex, stepCount) {
  return Array.from({ length: stepCount }, (_, index) => {
    const active = index === activeStepIndex
    return {
      stepState: active ? 'active' : 'inactive',
      imageState: active ? 'active' : 'inactive',
      ringActive: active,
      calloutsActive: active && index === 0,
    }
  })
}

export function createHowItWorksProgressionController({
  target,
  stepCount,
  onStateChange = () => {},
  matchMedia = typeof globalThis.matchMedia === 'function'
    ? globalThis.matchMedia.bind(globalThis)
    : undefined,
  Observer = globalThis.IntersectionObserver,
}) {
  const preference = typeof matchMedia === 'function'
    ? matchMedia('(prefers-reduced-motion: reduce)')
    : null
  let activeStepIndex = 0
  let sectionInView = false
  let reducedMotion = Boolean(preference?.matches)
  let disposed = false

  const getState = () => ({
    activeStepIndex,
    isCycleRunning: shouldRunLoop({ inView: sectionInView, reducedMotion }),
    stepStates: buildHowStepStates(activeStepIndex, stepCount),
  })
  const emitState = () => {
    const state = getState()
    onStateChange(state)
    return state
  }
  const updateVisibility = (inView) => {
    if (disposed) return
    sectionInView = inView
    emitState()
  }
  const updatePreference = (event) => {
    if (disposed) return
    reducedMotion = Boolean(event?.matches ?? preference?.matches)
    if (reducedMotion) activeStepIndex = 0
    emitState()
  }
  const disconnectVisibility = observeHowSectionVisibility(target, updateVisibility, Observer)

  preference?.addEventListener?.('change', updatePreference)
  emitState()

  return {
    getState,
    handleAnimationEnd(event) {
      if (
        disposed
        || event?.animationName !== 'how-step-progress'
        || !getState().isCycleRunning
      ) return getState()

      activeStepIndex = nextLoopIndex(activeStepIndex, stepCount)
      return emitState()
    },
    cleanup() {
      if (disposed) return
      disposed = true
      disconnectVisibility()
      preference?.removeEventListener?.('change', updatePreference)
    },
  }
}

export function resolveHeaderMode({ introComplete, withinHero, direction, directionDistance, currentMode = 'dormant' }) {
  if (!introComplete || withinHero) return 'hero'
  if (direction === 'up' && directionDistance >= 56) return 'compact'
  if (direction === 'down' && directionDistance >= 24) return 'hidden'
  return currentMode === 'hero' ? 'dormant' : currentMode
}
