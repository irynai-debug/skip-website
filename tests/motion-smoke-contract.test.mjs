import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const createElement = (attributes = {}, { queries = {}, lists = {}, style = {}, disabled = false, tabIndex = 0 } = {}) => ({
  disabled,
  tabIndex,
  getAttribute: (name) => attributes[name] ?? null,
  hasAttribute: (name) => Object.hasOwn(attributes, name),
  querySelector: (selector) => queries[selector] ?? null,
  querySelectorAll: (selector) => lists[selector] ?? [],
  style: { getPropertyValue: (name) => style[name] ?? '' },
})

const createApprovedContractFixture = () => {
  const heroGroups = ['heading', 'support', 'specs', 'lower-left', 'outcomes'].map((group, index) => createElement(
    { 'data-motion-group': group },
    { style: { transitionDuration: '800ms', transitionDelay: `${index * 90}ms` } },
  ))
  const metricRows = Array.from({ length: 4 }, (_, index) => createElement({}, {
    style: { transitionDuration: '800ms', transitionDelay: `${180 + index * 90}ms` },
  }))
  heroGroups[2].querySelectorAll = (selector) => selector === '.ds-metric-row' ? metricRows : []
  const hero = createElement({}, {
    lists: { '[data-motion-group]': heroGroups },
    queries: Object.fromEntries(heroGroups.map((group) => [`[data-motion-group="${group.getAttribute('data-motion-group')}"]`, group])),
  })

  const howSteps = ['01', '02', '03', '04'].map((number, index) => createElement({
    'data-step-state': index === 0 ? 'active' : 'inactive',
    'aria-current': index === 0 ? 'step' : null,
    'data-step-number': number,
    'data-how-entrance': 'step',
  }, { style: { transitionDuration: '800ms', transitionDelay: `${160 + index * 90}ms` } }))
  const howImages = howSteps.map((_, index) => createElement(
    { 'data-step-state': index === 0 ? 'active' : 'inactive' },
    { style: { transitionDuration: '700ms' } },
  ))
  const howMedia = createElement({ 'data-how-entrance': 'media' }, {
    style: { transitionDuration: '750ms', transitionDelay: '0ms' },
  })
  const howHeading = createElement({ 'data-how-entrance': 'heading', 'data-motion-heading-mode': 'coherent' }, {
    style: { transitionDuration: '800ms', transitionDelay: '0ms' },
  })
  const howSupport = createElement({ 'data-how-entrance': 'support' }, {
    style: { transitionDuration: '800ms', transitionDelay: '90ms' },
  })
  const how = createElement({ 'data-how-cycle': 'running' }, {
    style: { '--how-step-duration': '4200ms' },
    lists: {
      '.how-step': howSteps,
      '.how__image': howImages,
      '.how-step[data-how-entrance="step"]': howSteps,
    },
    queries: {
      '.how-step__progress-value': createElement(),
      '.how__media[data-how-entrance="media"]': howMedia,
      '.how [data-how-entrance="heading"]': howHeading,
      '.how [data-how-entrance="support"]': howSupport,
    },
  })

  const technologyFeatures = ['01', '02', '03', '04', '05', '06'].map((number, index) => {
    const queries = {
      '.technology-feature__connector path': createElement({}, { style: { animationDuration: '800ms' } }),
      '.technology-feature__icon': createElement({}, { style: { transitionDuration: '800ms' } }),
      '.technology-feature__number': createElement({}, { style: { transitionDuration: '800ms' } }),
      '.technology-feature__content > h3': createElement({}, { style: { transitionDuration: '800ms' } }),
      ".technology-feature__content > [data-type-role='body']": createElement({}, { style: { transitionDuration: '800ms' } }),
    }
    return createElement({ 'data-technology-feature-index': number }, {
      queries,
      style: {
        '--technology-connector-delay': `${index * 120}ms`,
        '--technology-icon-delay': `${index * 120 + 120}ms`,
        '--technology-number-delay': `${index * 120 + 200}ms`,
        '--technology-title-delay': `${index * 120 + 280}ms`,
        '--technology-body-delay': `${index * 120 + 360}ms`,
      },
    })
  })
  const poster = createElement({ alt: 'MO/GO powered wearable support system', width: '1600', height: '1600' })
  const technologyMedia = createElement({ 'data-model-state': 'poster' }, {
    queries: { '.technology__poster': poster },
  })
  const technology = createElement({ 'data-technology-depth': 'active', 'data-model-interacting': 'false' }, {
    lists: { '[data-technology-feature-index]': technologyFeatures },
    queries: { '.technology__media': technologyMedia },
  })

  const identityStates = ['active', 'inactive', 'inactive'].map((state) => createElement({ 'data-carousel-state': state }))
  const copyStates = ['active', 'inactive', 'inactive'].map((state) => createElement({ 'data-carousel-state': state }))
  const testimonialEntrances = ['portrait', 'name', 'role', 'quote', 'support', 'navigation'].map((part, index) => createElement(
    {
      'data-testimonial-entrance': part,
      'data-motion-heading-mode': part === 'quote' ? 'coherent' : null,
    },
    { style: { transitionDuration: '800ms', transitionDelay: `${[0, 80, 140, 200, 290, 380][index]}ms` } },
  ))
  const testimonial = createElement({
    'data-carousel-active-index': '0',
    'data-carousel-direction': 'next',
    'data-carousel-transition': 'false',
  }, {
    lists: {
      '.testimonial__identity-state': identityStates,
      '.testimonial__copy-state': copyStates,
      '[data-testimonial-entrance]': testimonialEntrances,
    },
    queries: {
      '.testimonial__copy-slot[aria-live="polite"]': createElement(),
      '[aria-label="Previous testimonial"]': createElement({ 'aria-controls': 'testimonial-slides' }),
      '[aria-label="Next testimonial"]': createElement({ 'aria-controls': 'testimonial-slides' }),
      ...Object.fromEntries(testimonialEntrances.map((element) => [
        `[data-testimonial-entrance="${element.getAttribute('data-testimonial-entrance')}"]`,
        element,
      ])),
    },
  })

  const footerEntrances = ['heading', 'support', 'cta', 'navigation'].map((part, index) => createElement(
    { 'data-footer-entrance': part, 'data-motion-heading-mode': part === 'heading' ? 'coherent' : null },
    { style: { transitionDuration: '800ms', transitionDelay: `${index * 90}ms` } },
  ))
  const footer = createElement({ 'data-footer-depth': 'active' }, {
    lists: { '[data-footer-entrance]': footerEntrances },
    queries: {
      '.footer__background': createElement(),
      '.footer__inner': createElement(),
    },
  })

  const cookie = createElement({}, {
    queries: {
      '[data-cookie-preference="accepted"]': createElement(),
      '[data-cookie-preference="declined"]': createElement(),
    },
  })
  const roots = {
    '.hero': hero,
    '.how': how,
    '.technology': technology,
    '.testimonial': testimonial,
    '.footer': footer,
    '.site-header .ds-site-header__menu': createElement({ 'aria-controls': 'primary-navigation', 'aria-expanded': 'false' }),
    '#primary-navigation': createElement(),
    '.cookie-consent': cookie,
  }
  const preorderTriggers = ['header', 'hero', 'how-it-works', 'footer'].map((value) => createElement({ 'data-preorder-trigger': value }))
  return {
    querySelector: (selector) => roots[selector] ?? null,
    querySelectorAll: (selector) => {
      if (selector === '[data-preorder-trigger]') return preorderTriggers
      if (selector === '.ds-button .button__label-current') return Array.from({ length: 6 }, () => createElement())
      return []
    },
  }
}

test('motion smoke consumes the approved section contracts and functional controls', async () => {
  const [{ auditApprovedMotionContract }, manifestSource] = await Promise.all([
    import('../.site-builder/qa-tools/motion-smoke-test.js'),
    readFile(new URL('../.site-builder/motion.json', import.meta.url), 'utf8'),
  ])
  assert.equal(typeof auditApprovedMotionContract, 'function')

  const results = await auditApprovedMotionContract(
    createApprovedContractFixture(),
    JSON.parse(manifestSource),
    { reducedMotion: false },
  )

  assert.deepEqual(results.map(({ id }) => id), [
    'hero-entrance-groups',
    'hero-entrance-timing',
    'how-progression-contract',
    'how-entrance-contract',
    'technology-feature-phases',
    'technology-viewer-fallback',
    'testimonial-carousel-contract',
    'testimonial-entrance-contract',
    'testimonial-controls',
    'footer-entrance-contract',
    'footer-depth-contract',
    'shared-button-contract',
    'functional-header-menu',
    'functional-preorder-triggers',
    'functional-cookie-controls',
  ])
  assert.deepEqual(results.filter(({ status }) => status === 'fail'), [])
})

test('motion manifest omits obsolete generic slides and fabricated Technology tilt', async () => {
  const manifest = JSON.parse(await readFile(new URL('../.site-builder/motion.json', import.meta.url), 'utf8'))

  assert.equal(manifest.schemaVersion, 2)
  assert.equal(manifest.tokens.headingEasing, 'cubic-bezier(0.22, 1, 0.36, 1)')
  assert.deepEqual(manifest.sections, [])
  assert.equal(manifest.howItWorks.selector, '.how')
  assert.equal(manifest.hero.counters.durationMs, 1350)
  assert.equal(manifest.hero.counters.easing, 'easeInOutSine')
  assert.deepEqual(manifest.howItWorks.entrance, {
    media: {
      selector: '.how__media[data-how-entrance="media"]',
      direction: 'down',
      durationMs: 750,
      delayMs: 0,
    },
    heading: {
      selector: '.how [data-how-entrance="heading"]',
      durationMs: 800,
      delayMs: 0,
      coherent: true,
    },
    support: {
      selector: '.how [data-how-entrance="support"]',
      durationMs: 800,
      delayMs: 90,
    },
    steps: {
      selector: '.how-step[data-how-entrance="step"]',
      count: 4,
      durationMs: 800,
      initialDelayMs: 160,
      staggerMs: 90,
      layoutStatic: true,
    },
    reducedMotion: 'settled-visible',
  })
  assert.equal(manifest.microinteractions?.some(({ selector, type }) => selector === '.technology__media' && type === 'pointer-tilt'), false)
  assert.deepEqual(manifest.technology.viewer, {
    selector: '.technology__media',
    posterSelector: '.technology__poster',
    canvasSelector: '.technology__canvas',
    stateAttribute: 'data-model-state',
    interaction: 'manual-drag-and-arrow-keys',
    reducedMotion: 'poster',
  })
  assert.deepEqual(manifest.technology.annotationEntrance.phaseDelayMs, {
    connector: 0,
    icon: 120,
    number: 200,
    title: 280,
    body: 360,
  })
  assert.equal(manifest.technology.annotationEntrance.phaseDurationMs, 800)
  assert.equal(manifest.technology.annotationEntrance.maximumCompletionMs, 1760)
  assert.deepEqual(manifest.testimonials.entrance, {
    once: true,
    durationMs: 800,
    parts: ['portrait', 'name', 'role', 'quote', 'support', 'navigation'],
    delayMs: [0, 80, 140, 200, 290, 380],
    coherentText: true,
  })
  assert.deepEqual(manifest.footer.entrance, {
    once: true,
    durationMs: 800,
    parts: ['heading', 'support', 'cta', 'navigation'],
    delayMs: [0, 90, 180, 270],
    headingMode: 'coherent',
    translateY: -24,
  })
})

test('motion smoke treats a hidden Hero fallback as static and uses the layout viewport width', async () => {
  const {
    fillsDocumentWidth,
    hasMeaningfulTransformTransition,
    layerTraceMatchesParallax,
    matchesFullWidthShellConstrainedInner,
    phaseDurationMatches,
  } = await import('../.site-builder/qa-tools/motion-smoke-test.js')

  assert.equal(typeof layerTraceMatchesParallax, 'function')
  assert.equal(typeof fillsDocumentWidth, 'function')
  assert.equal(layerTraceMatchesParallax({
    hidden: true,
    start: 'none',
    middle: 'none',
    clamped: 'none',
    reversed: 'none',
  }, false), true)
  assert.equal(layerTraceMatchesParallax({
    hidden: false,
    start: 'matrix(1, 0, 0, 1, 0, 0)',
    middle: 'matrix(1, 0, 0, 1, 0, 12)',
    clamped: 'matrix(1, 0, 0, 1, 0, 24)',
    reversed: 'matrix(1, 0, 0, 1, 0, 12)',
  }, false), true)
  assert.equal(fillsDocumentWidth({ width: 1425 }, { documentElement: { clientWidth: 1425 } }), true)
  assert.equal(fillsDocumentWidth({ width: 1425 }, { documentElement: { clientWidth: 1440 } }), false)
  assert.equal(matchesFullWidthShellConstrainedInner(
    { left: 0, right: 1440, width: 1440 },
    { left: 48, right: 1392, width: 1344 },
    { documentElement: { clientWidth: 1440 } },
  ), true)
  assert.equal(matchesFullWidthShellConstrainedInner(
    { left: 8, right: 1432, width: 1424 },
    { left: 48, right: 1392, width: 1344 },
    { documentElement: { clientWidth: 1440 } },
  ), false)
  assert.equal(matchesFullWidthShellConstrainedInner(
    { left: 0, right: 1440, width: 1440 },
    { left: 32, right: 1392, width: 1360 },
    { documentElement: { clientWidth: 1440 } },
  ), false)

  assert.equal(hasMeaningfulTransformTransition({
    transitionProperty: 'all',
    transitionDuration: '0.01ms',
  }, true), false)
  assert.equal(hasMeaningfulTransformTransition({
    transitionProperty: 'transform',
    transitionDuration: '300ms',
  }, true), true)
  assert.equal(hasMeaningfulTransformTransition({
    transitionProperty: 'opacity, transform',
    transitionDuration: '300ms, 0s',
  }, false), false)

  assert.equal(phaseDurationMatches({
    transitionDuration: '0s',
    display: 'none',
  }, 'transitionDuration', 'transition-duration', 800), true)
  const hiddenConnector = { display: 'none' }
  assert.equal(phaseDurationMatches({
    transitionDuration: '0s',
    display: 'inline',
    closest: () => hiddenConnector,
  }, 'transitionDuration', 'transition-duration', 800, (element) => element), true)
  assert.equal(phaseDurationMatches({
    transitionDuration: '0.8s',
    display: 'block',
  }, 'transitionDuration', 'transition-duration', 800), true)
  assert.equal(phaseDurationMatches({
    transitionDuration: '0.4s',
    display: 'block',
  }, 'transitionDuration', 'transition-duration', 800), false)
})
