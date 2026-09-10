import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import * as content from '../src/siteContent.js'
import { Site } from '../src/Site.jsx'

const readInteractiveSource = () => readFile(new URL('../src/site/InteractiveSections.jsx', import.meta.url), 'utf8')
const readFooterSource = () => readFile(new URL('../src/site/Footer.jsx', import.meta.url), 'utf8')
const readSiteImplementation = async () => (await Promise.all([
  readFile(new URL('../src/Site.jsx', import.meta.url), 'utf8'),
  readInteractiveSource(),
  readFooterSource(),
  readFile(new URL('../src/site/SiteRuntime.jsx', import.meta.url), 'utf8'),
])).join('\n')

test('the production content model exposes the five Skip references in order', () => {
  assert.deepEqual(content.SITE_SECTIONS.map(({ id }) => id), [
    'hero',
    'how-it-works',
    'technology',
    'testimonial',
    'footer',
  ])
})

test('the hero preserves its exact visible copy and metric order', () => {
  assert.equal(content.HERO_COPY.heading, 'MEET\nNEW\nMO/GO')
  assert.equal(content.HERO_COPY.lead, 'Wearable tech for more freedom\nin every step you make.')
  assert.equal(content.HERO_COPY.body, 'MO/GO helps you go further, climb higher\nand stay active—so you can keep exploring\nwhat moves you.')
  assert.deepEqual(content.HERO_COPY.navigation, ['How it works', 'Product', 'Testimonials'])
  assert.deepEqual(content.HERO_METRICS, [
    ['Uphill Support', '+40%'],
    ['Impact Reduction', '-30%'],
    ['Battery Life', '8+ hrs'],
    ['Weight', '1.8 kg'],
  ])
})

test('the rendered primary navigation exposes exactly the three requested landing-section links', () => {
  const markup = renderToStaticMarkup(React.createElement(Site))
  const navigationMarkup = markup.match(/<nav id="primary-navigation"[^>]*><ul>([\s\S]*?)<\/ul><\/nav>/)

  assert.ok(navigationMarkup, 'primary navigation must be rendered')
  const links = Array.from(
    navigationMarkup[1].matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>\s*<span>([^<]+)<\/span>\s*<\/a>/g),
    ([, href, label]) => ({ label, href }),
  )

  assert.deepEqual(links, [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Product', href: '#technology' },
    { label: 'Testimonials', href: '#testimonial' },
  ])
})

test('the how-it-works model preserves all four numbered steps', () => {
  assert.equal(content.HOW_IT_WORKS_COPY.heading, 'HOW IT\nWORKS')
  assert.equal(content.HOW_IT_WORKS_COPY.body, 'Getting started with MO/GO is simple.\nFour steps to more freedom in every step.')
  assert.deepEqual(content.HOW_IT_WORKS_STEPS.map(({ number, title }) => [number, title]), [
    ['01', 'Take the first step'],
    ['02', 'Find your fit'],
    ['03', 'Get set up'],
    ['04', 'Move with confidence'],
  ])
})

test('the how-it-works progression advances one step at a time and loops', () => {
  assert.equal(content.HOW_IT_WORKS_STEP_DURATION_MS, 4200)
  assert.deepEqual(
    [0, 1, 2, 3].map((index) => content.getNextHowItWorksStepIndex(index)),
    [1, 2, 3, 0],
  )
})

test('the technology model preserves its six features and exact em dash', () => {
  assert.deepEqual(content.TECHNOLOGY_FEATURES.map(({ number, title }) => [number, title]), [
    ['01', 'SENSES MOVEMENT'],
    ['02', 'ADAPTS INSTANTLY'],
    ['03', 'NATURAL SUPPORT'],
    ['04', 'PROVIDES ASSIST'],
    ['05', 'LIGHTWEIGHT DESIGN'],
    ['06', 'BUILT TO ENDURE'],
  ])
  assert.equal(content.TECHNOLOGY_FEATURES[2].body, 'Works with your body\n— not against it.')
})

test('the testimonial carousel preserves all three exact content states', () => {
  assert.deepEqual(content.TESTIMONIALS, [
    {
      name: 'DANIEL R.',
      role: 'HIKER & TRAVELER',
      quote: 'I can hike longer,\nclimb higher and explore\nmore with less strain.',
      body: 'MO/GO gives me the support I need to stay\nactive and keep doing what I love.',
      image: content.ASSETS.testimonials.daniel,
      alt: 'Daniel, a hiker and traveler, in the mountains',
    },
    {
      name: 'MAYA L.',
      role: 'TRAIL RUNNER & EXPLORER',
      quote: 'I move with more confidence,\ncover more ground and still have\nenergy left.',
      body: 'MO/GO adapts naturally to my movement, so every\ntrail feels easier and more enjoyable.',
      image: content.ASSETS.testimonials.maya,
      alt: 'Maya, a trail runner and explorer, on a green hillside',
    },
    {
      name: 'MICHAEL T.',
      role: 'HIKER & PHOTOGRAPHER',
      quote: 'Steep climbs feel smoother,\nlonger walks feel lighter and I\ncan keep going.',
      body: 'MO/GO helps reduce the effort of each step without\nchanging how I naturally move.',
      image: content.ASSETS.testimonials.michael,
      alt: 'Michael, a hiker and photographer, on a rocky trail',
    },
  ])
  assert.equal(content.getAdjacentTestimonialIndex(0, -1), 2)
  assert.equal(content.getAdjacentTestimonialIndex(0, 1), 1)
  assert.equal(content.getAdjacentTestimonialIndex(2, 1), 0)
  assert.equal(content.FOOTER_COPY.heading, 'READY TO MOVE\nFURTHER?')
  assert.equal(content.FOOTER_COPY.body, 'Reserve your MO/GO and\ndiscover what’s possible.')
  assert.equal(content.FOOTER_COPY.copyright, '© 2025 Skip. All rights reserved.')
  assert.deepEqual(content.FOOTER_GROUPS.map(({ title }) => title), ['PRODUCT', 'COMPANY', 'RESOURCES'])
})

test('project-owned production rasters resolve to explicit optimized assets', () => {
  assert.equal(content.ASSETS.heroBackground.src, '/assets/skip/optimized/hero-3200.webp')
  assert.deepEqual(content.ASSETS.howItWorks.map(({ src }) => src), [
    '/assets/skip/optimized/how-01-1134.webp',
    '/assets/skip/optimized/how-02-1600.webp',
    '/assets/skip/optimized/how-03-1600.webp',
    '/assets/skip/optimized/how-04-1600.webp',
  ])
  assert.equal(content.ASSETS.technology.src, '/assets/skip/optimized/technology-1536.webp')
  assert.equal(content.ASSETS.footerBackground.src, '/assets/skip/optimized/footer-1721.webp')
  assert.deepEqual(Object.values(content.ASSETS.testimonials).map(({ src }) => src), [
    '/assets/skip/optimized/testimonial-daniel-384.webp',
    '/assets/skip/optimized/testimonial-maya-384.webp',
    '/assets/skip/optimized/testimonial-michael-384.webp',
  ])
})

test('CMS image paths preserve current responsive assets and safely replace them after upload', async () => {
  assert.equal(content.TECHNOLOGY_POSTER, content.ASSETS.technology)
  assert.deepEqual(content.TESTIMONIALS.map(({ image }) => image), Object.values(content.ASSETS.testimonials))

  const replacement = content.resolveEditableImageAsset(
    '/uploads/testimonials/new-portrait.webp',
    content.ASSETS.testimonials.daniel,
  )
  assert.deepEqual(replacement, {
    src: '/uploads/testimonials/new-portrait.webp',
    sizes: '(max-width: 480px) 96px, (max-width: 820px) 128px, 176px',
    width: 1254,
    height: 1254,
  })

  const interactiveSource = await readInteractiveSource()
  assert.match(interactiveSource, /poster=\{TECHNOLOGY_POSTER\}/)
})

test('production actions use verified official Skip destinations', () => {
  assert.equal(content.DESTINATIONS.reserve, 'https://www.skipwithjoy.com/reserve/p/style-01-ej5na-hbs9d')
  assert.equal(content.DESTINATIONS.learn, 'https://www.skipwithjoy.com/learn')
  assert.equal(content.DESTINATIONS.faq, 'https://www.skipwithjoy.com/faq')
  assert.equal(content.DESTINATIONS.about, 'https://www.skipwithjoy.com/aboutus')
  assert.equal(content.DESTINATIONS.careers, 'https://www.skipwithjoy.com/careers')
  assert.equal(content.DESTINATIONS.linkedin, 'https://www.linkedin.com/company/skipwithjoy')
  assert.deepEqual(content.SOCIAL_DESTINATIONS, {
    Instagram: 'https://www.instagram.com/elissiyas/',
    YouTube: 'https://www.youtube.com/watch?v=B5lzYG83yVQ&list=RDB5lzYG83yVQ&start_radio=1',
    LinkedIn: 'https://www.linkedin.com/in/elisdechart/',
    X: 'https://x.com/DechartElis',
  })
  assert.deepEqual(content.FOOTER_DESTINATIONS, {
    'MO/GO Overview': undefined,
    'Key Features': undefined,
    'Product Design': undefined,
    'Tech Specifications': undefined,
    'Pre-Order': content.DESTINATIONS.reserve,
    'Our Mission': undefined,
    'About Skip': content.DESTINATIONS.about,
    Careers: content.DESTINATIONS.careers,
    'News & Press': undefined,
    'Contact Us': content.DESTINATIONS.contact,
    'How It Works': undefined,
    Technology: undefined,
    'User Stories': undefined,
    FAQs: content.DESTINATIONS.faq,
  })
})

test('footer social controls open every full circular link safely in a new tab', async () => {
  const footerSource = await readFooterSource()
  assert.match(footerSource, /<IconLink[^>]+href=\{href\}[^>]+label=\{label\}[^>]+target="_blank"[^>]+rel="noopener noreferrer"/)
})

test('production assets use static URLs so numbered reference screenshots are not bundled', async () => {
  const [contentSource, siteSource, footerSource, qaSource] = await Promise.all([
    readFile(new URL('../src/siteContent.js', import.meta.url), 'utf8'),
    readInteractiveSource(),
    readFooterSource(),
    readFile(new URL('../src/qaRuntime.js', import.meta.url), 'utf8'),
  ])
  assert.doesNotMatch(contentSource, /new URL\(`\.\.\/input\/\$\{name\}`/)
  assert.match(contentSource, /const OPTIMIZED_ASSET_ROOT = assetPath\('\/assets\/skip\/optimized'\)/)
  assert.match(contentSource, /stem: 'hero'/)
  assert.doesNotMatch(contentSource, /input\/hero-background\.png/)
  assert.match(footerSource, /className="footer__background"[^>]+loading="lazy"[^>]+decoding="async"/)
  assert.match(qaSource, /mode === 'design-system-production'/)
  assert.match(qaSource, /img\[loading="lazy"\]/)
  assert.match(qaSource, /image\.loading = 'eager'/)
})

test('the single production design system owns required roles and repeated components', async () => {
  const [designSystemSource, siteSource, gallerySource, styleSource] = await Promise.all([
    readFile(new URL('../src/design-system/index.jsx', import.meta.url), 'utf8'),
    readInteractiveSource(),
    readFile(new URL('../src/design-system/Gallery.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/design-system/styles.css', import.meta.url), 'utf8'),
  ])

  for (const role of ['display', 'h1', 'h2', 'h3', 'body-large', 'body', 'label', 'number-small', 'number-large', 'button']) {
    assert.match(designSystemSource, new RegExp(`['\"]${role}['\"]`))
    assert.match(styleSource, new RegExp(`data-type-role=['\"]${role}['\"]`))
  }
  for (const sharedExport of ['Button', 'IconButton', 'IconLink', 'Link', 'MetricRow', 'Divider', 'SiteHeader']) {
    assert.match(designSystemSource, new RegExp(`export function ${sharedExport}\\b`))
    assert.match(gallerySource, new RegExp(`<${sharedExport}\\b`))
  }
  assert.match(siteSource, /from '\.\.\/design-system\/index\.jsx'/)
  assert.doesNotMatch(siteSource, /export function (Button|IconButton|Link|MetricRow|Divider|SiteHeader)\b/)
  assert.match(designSystemSource, /const Tag = href \? 'a' : 'span'/)
  assert.match(designSystemSource, /data-ds-state=\{href \? 'default' : 'disabled'\}/)
  assert.match(styleSource, /data-ds-state='disabled'[^}]+cursor:\s*default/)
  assert.match(styleSource, /data-ds-state='disabled'[^}]+pointer-events:\s*none/)
})

test('the display role uses a valid token-based font shorthand', async () => {
  const styleSource = await readFile(new URL('../src/design-system/styles.css', import.meta.url), 'utf8')
  assert.doesNotMatch(styleSource, /font:\s*700\s+\.84\s+var\(--type-display-size\)/)
  assert.match(styleSource, /font:\s*700\s+var\(--type-display-size\)\s*\/\s*\.78/)
})

test('the QA runtime uses project-specific storage keys', async () => {
  const source = await readFile(new URL('../src/qaRuntime.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /birdpulse:/)
  assert.match(source, /skip:design-system-catalogue/)
  assert.match(source, /ignore: \['\.ds-sr-only'\]/)
})

test('heading roles preserve authored casing instead of transforming copy', async () => {
  const styleSource = await readFile(new URL('../src/design-system/styles.css', import.meta.url), 'utf8')
  for (const role of ['display', 'h1', 'h2']) {
    const start = styleSource.indexOf(`[data-type-role='${role}']`)
    const end = styleSource.indexOf('\n}', start)
    assert.ok(start >= 0 && end > start)
    assert.doesNotMatch(styleSource.slice(start, end), /text-transform:/)
  }
})

test('the production page renders the reviewed footer states through shared DS primitives', async () => {
  const footerSource = await readFooterSource()
  assert.match(footerSource, /export function Footer\(/)
  assert.match(footerSource, /FOOTER_GROUPS\.map/)
  assert.match(footerSource, /<Button[^>]+variant="primary-borderless"/)
  assert.doesNotMatch(footerSource, /<Button[^>]+icon=/)
  assert.match(footerSource, /<Link[^>]+variant="footer-secondary"/)
  assert.match(footerSource, /<Divider variant="subtle"/)
  assert.match(footerSource, /<Divider variant="subtle-vertical"/)
  assert.match(footerSource, /<IconLink[^>]+variant="outline-muted"/)
})

test('reviewed technology annotations use compact content units and individual connector geometry', async () => {
  const siteSource = await readInteractiveSource()
  const featureSource = siteSource.slice(siteSource.indexOf('function TechnologyFeature'), siteSource.indexOf('export function Technology()'))
  assert.match(featureSource, /technology-feature__content/)
  assert.match(featureSource, /technology-feature__connector[^\n]+<path/)
  assert.match(featureSource, /<circle/)
  assert.doesNotMatch(featureSource, /<span className="technology-feature__connector"/)
})

test('testimonial navigation belongs to the quote content block', async () => {
  const [siteSource, styleSource, designSystemSource] = await Promise.all([
    readInteractiveSource(),
    readFile(new URL('../src/design-system/styles.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/design-system/index.jsx', import.meta.url), 'utf8'),
  ])
  const testimonialSource = siteSource.slice(siteSource.indexOf('export function Testimonial()'))
  assert.match(testimonialSource, /className="testimonial__quote"[\s\S]+className="testimonial__support"[\s\S]+className="testimonial__arrows"[\s\S]+<\/div>\s*<\/div>\s*<\/PageGrid>/)
  assert.match(testimonialSource, /TESTIMONIALS\[activeIndex\]/)
  assert.match(testimonialSource, /onClick=\{\(\) => changeTestimonial\(-1\)\}/)
  assert.match(testimonialSource, /onClick=\{\(\) => changeTestimonial\(1\)\}/)
  assert.doesNotMatch(testimonialSource, /<IconButton[^>]+disabled/)
  assert.match(testimonialSource, /glyphSize="large"/)
  assert.match(testimonialSource, /aria-live="polite"/)
  assert.match(designSystemSource, /glyphSizes:\s*\['default', 'large'\]/)
  assert.match(styleSource, /\.ds-icon-button--glyph-large[^}]+width:\s*28px;[^}]+height:\s*28px;/s)
})

test('motion integration keeps the accepted code-reference contract', async () => {
  const [siteSource, motionSource, manifestSource] = await Promise.all([
    readInteractiveSource(),
    readFile(new URL('../src/motion.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../.site-builder/motion.json', import.meta.url), 'utf8'),
  ])
  assert.match(siteSource, /<MotionHeading/)
  assert.match(siteSource, /useHeaderMotionState\(\)/)
  assert.match(siteSource, /data-motion-hero-parallax-speed="0\.04"/)
  assert.match(siteSource, /data-motion-hero-parallax-distance="24"/)
  assert.match(motionSource, /resolveHeaderMode/)
  const manifest = JSON.parse(manifestSource)
  assert.equal(manifest.implementationPolicy, 'user-directed-motion-pass')
  assert.equal(manifest.tokens.headingDurationMs, 800)
  assert.equal(manifest.hero.graphicsParallax.layerCount, 3)
  assert.deepEqual(manifest.howItWorks, {
    selector: '.how',
    stepSelector: '.how-step',
    imageSelector: '.how__image',
    progressSelector: '.how-step__progress-value',
    durationMs: 4200,
    imageTransitionMs: 700,
    activeToken: '--ds-color-action-active',
    observerThreshold: 0.2,
    sequence: ['01', '02', '03', '04'],
    loop: true,
    viewport: 'pause-resume-without-reset',
    reducedMotion: 'static-step-01',
    entrance: {
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
    },
  })
  assert.deepEqual(manifest.capabilities, {
    pointerDepth: '(hover: hover) and (pointer: fine)',
    coarseOrTouch: ['(hover: none)', '(pointer: coarse)'],
    reducedMotion: '(prefers-reduced-motion: reduce)',
  })
  assert.equal(manifest.reducedMotion.presentation, 'immediate-static')
  assert.equal(manifest.reducedMotion.howItWorks, 'static-step-01')
  assert.equal(manifest.hero.depth.delivery, 'atomic-pair-with-flattened-fallback')
  assert.deepEqual(manifest.hero.depth.layers.map(({ maximumX, maximumY }) => [maximumX, maximumY]), [[16, 8], [3, 2]])
  assert.deepEqual(manifest.technology.annotationEntrance.phaseDelayMs, { connector: 0, icon: 120, number: 200, title: 280, body: 360 })
  assert.equal(manifest.technology.annotationEntrance.phaseDurationMs, 800)
  assert.equal(manifest.technology.annotationEntrance.maximumCompletionMs, 1760)
  assert.equal(manifest.testimonials.carousel.durationMs, 450)
  assert.equal(manifest.testimonials.carousel.distancePx, 32)
  assert.deepEqual(manifest.footer.depth.maximumTravelPx, { x: 12, y: 6 })
  assert.deepEqual(manifest.sharedButton, {
    selector: '.ds-button .button__label-current',
    type: 'label-blur-pulse',
    durationMs: 300,
    maximumBlurPx: 4,
    minimumCount: 4,
    pointer: 'fine-only',
    reducedMotion: 'none',
  })
})

test('header scroll state delegates accepted transitions to the motion resolver', async () => {
  const motionSource = await readFile(new URL('../src/motion.jsx', import.meta.url), 'utf8')

  assert.match(motionSource, /import \{ resolveHeaderMode \} from '\.\/motionModel\.js'/)
  assert.match(motionSource, /const nextMode = resolveHeaderMode\(\{[\s\S]*currentMode: modeRef\.current,[\s\S]*\}\)/)
  assert.match(motionSource, /if \(nextMode !== modeRef\.current\) \{[\s\S]*directionDistance = 0/)
})

test('animated copy remains available to assistive technology', async () => {
  const [siteSource, motionSource, styleSource] = await Promise.all([
    readSiteImplementation(),
    readFile(new URL('../src/motion.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/design-system/styles.css', import.meta.url), 'utf8'),
  ])
  assert.match(siteSource, /className="ds-sr-only"/)
  assert.match(motionSource, /className="ds-sr-only"/)
  assert.doesNotMatch(motionSource, /aria-label=\{label\}/)
  assert.match(styleSource, /\.ds-sr-only\s*\{/)
})

test('responsive header exposes a labelled keyboard-operable menu and preserves metrics', async () => {
  const [designSystemSource, siteSource, designSystemStyles, appStyles] = await Promise.all([
    readFile(new URL('../src/design-system/index.jsx', import.meta.url), 'utf8'),
    readSiteImplementation(),
    readFile(new URL('../src/design-system/styles.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/app.css', import.meta.url), 'utf8'),
  ])
  assert.match(designSystemSource, /aria-expanded=\{menuOpen\}/)
  assert.match(designSystemSource, /aria-controls=\{navigationId\}/)
  assert.match(designSystemSource, /navigationId = 'primary-navigation'/)
  assert.match(siteSource, /event\.key === 'Escape'/)
  assert.match(designSystemStyles, /data-menu-open=['"]true['"]/) 
  assert.doesNotMatch(appStyles, /\.hero__product-metrics\s*\{\s*display:\s*none/)
})

test('page landmarks and section headings retain a valid semantic outline', async () => {
  const siteSource = await readSiteImplementation()
  assert.match(siteSource, /<a href="#main-content" className="skip-link">/)
  assert.match(siteSource, /<Header \/>[\s\S]*<main className="site-main" id="main-content">/)
  assert.match(siteSource, /<\/main>[\s\S]*<Footer \/>[\s\S]*<SiteRuntime \/>/)
  assert.match(siteSource, /id="technology-title"/)
  assert.match(siteSource, /as="h2" role="label" id="testimonial-title"/)
})

test('compact and secondary component surfaces use readable semantic pairs', async () => {
  const styleSource = await readFile(new URL('../src/design-system/styles.css', import.meta.url), 'utf8')
  assert.match(styleSource, /\.ds-button--secondary\s*\{[^}]*--button-bg:\s*var\(--ds-theme-surface\);[^}]*--button-fg:\s*var\(--ds-theme-text\)/s)
  assert.match(styleSource, /\.ds-site-header--compact\s*\{[^}]*background:\s*var\(--ds-color-ink\);/s)
  assert.match(styleSource, /\.ds-site-header--compact\s*\{[^}]*--ds-theme-text:\s*var\(--ds-color-surface\);/s)
  assert.doesNotMatch(styleSource, /\.ds-site-header--compact\s*\{[^}]*background:\s*rgba\(7,20,33,\.72\)/s)
})
