import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { ASSETS } from '../src/siteContent.js'
import { advanceHowImageDelivery } from '../src/howImageDelivery.js'


test('How image delivery grows active-plus-next without dropping crossfade-ready states', () => {
  let delivered = advanceHowImageDelivery(undefined, 0, 4)
  assert.deepEqual([...delivered], [0, 1])

  delivered = advanceHowImageDelivery(delivered, 1, 4)
  assert.deepEqual([...delivered], [0, 1, 2])

  delivered = advanceHowImageDelivery(delivered, 2, 4)
  assert.deepEqual([...delivered], [0, 1, 2, 3])

  assert.equal(advanceHowImageDelivery(delivered, 3, 4), delivered)
  assert.equal(advanceHowImageDelivery(delivered, 0, 4), delivered)
})

const expectedWidths = Object.freeze({
  heroBackground: [800, 1600, 2400, 3200],
  heroSky: [800, 1600, 2400, 3200],
  heroForeground: [800, 1600, 2400, 3200],
  howItWorks: [
    [480, 800, 1134],
    [480, 800, 1600],
    [480, 800, 1600],
    [480, 800, 1600],
  ],
  technology: [480, 768, 1536],
  preorderModalBackground: [800, 1600, 3200],
})

function assertResponsiveAsset(asset, widths) {
  assert.equal(asset.src.endsWith('.webp'), true)
  assert.deepEqual(asset.sources.map(({ width }) => width), widths)
  assert.equal(asset.srcSet, asset.sources.map(({ src, width }) => `${src} ${width}w`).join(', '))
  assert.equal(typeof asset.sizes, 'string')
  assert.equal(Number.isInteger(asset.width), true)
  assert.equal(Number.isInteger(asset.height), true)
}

function readWebPDimensions(bytes) {
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF')
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP')

  const format = bytes.subarray(12, 16).toString('ascii')
  if (format === 'VP8X') {
    return {
      width: bytes.readUIntLE(24, 3) + 1,
      height: bytes.readUIntLE(27, 3) + 1,
    }
  }

  if (format === 'VP8L') {
    const bits = bytes.readUInt32LE(21)
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    }
  }

  const frameHeader = bytes.indexOf(Buffer.from([0x9d, 0x01, 0x2a]))
  assert.notEqual(frameHeader, -1, 'lossy WebP must contain a VP8 frame header')
  return {
    width: bytes.readUInt16LE(frameHeader + 3) & 0x3fff,
    height: bytes.readUInt16LE(frameHeader + 5) & 0x3fff,
  }
}

test('Hero declares optimized sky and transparent foreground layers', () => {
  assert.equal(ASSETS.heroBackground.sizes, '(max-width: 820px) 100vw, 1600px')
  assertResponsiveAsset(ASSETS.heroSky, expectedWidths.heroSky)
  assertResponsiveAsset(ASSETS.heroForeground, expectedWidths.heroForeground)
  assert.equal(ASSETS.heroSky.sizes, '100vw')
  assert.equal(ASSETS.heroForeground.sizes, '100vw')
  assert.deepEqual([ASSETS.heroSky.width, ASSETS.heroSky.height], [6668, 4993])
  assert.deepEqual([ASSETS.heroForeground.width, ASSETS.heroForeground.height], [6668, 4993])
})

test('production raster descriptors expose only the approved responsive WebP candidates', () => {
  assertResponsiveAsset(ASSETS.heroBackground, expectedWidths.heroBackground)
  assertResponsiveAsset(ASSETS.heroSky, expectedWidths.heroSky)
  assertResponsiveAsset(ASSETS.heroForeground, expectedWidths.heroForeground)
  ASSETS.howItWorks.forEach((asset, index) => assertResponsiveAsset(asset, expectedWidths.howItWorks[index]))
  assertResponsiveAsset(ASSETS.technology, expectedWidths.technology)
  assertResponsiveAsset(ASSETS.preorderModalBackground, expectedWidths.preorderModalBackground)

  assert.equal(ASSETS.footerBackground.src, '/assets/skip/optimized/footer-1721.webp')
  assert.equal(ASSETS.footerBackground.width, 1721)
  assert.equal(ASSETS.footerBackground.height, 914)

  for (const portrait of Object.values(ASSETS.testimonials)) {
    assertResponsiveAsset(portrait, [192, 384])
  }
})

test('every declared WebP candidate exists and has a valid WebP container signature', async () => {
  const responsive = [
    ASSETS.heroBackground,
    ASSETS.heroSky,
    ASSETS.heroForeground,
    ...ASSETS.howItWorks,
    ASSETS.technology,
    ASSETS.preorderModalBackground,
    ...Object.values(ASSETS.testimonials),
  ]
  const paths = [
    ...responsive.flatMap(({ sources }) => sources.map(({ src }) => src)),
    ASSETS.footerBackground.src,
  ]

  for (const publicPath of new Set(paths)) {
    const file = new URL(`../public${publicPath}`, import.meta.url)
    const [metadata, bytes] = await Promise.all([stat(file), readFile(file)])
    assert.ok(metadata.size > 0, `${publicPath} must not be empty`)
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', `${publicPath} must use a RIFF container`)
    assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP', `${publicPath} must be WebP`)
  }
})

test('layered Hero candidates are real WebP files with the reproducible output dimensions', async () => {
  const expectedDimensions = new Map([
    [800, { width: 800, height: 599 }],
    [1600, { width: 1600, height: 1198 }],
    [2400, { width: 2400, height: 1797 }],
    [3200, { width: 3200, height: 2396 }],
  ])

  for (const asset of [ASSETS.heroSky, ASSETS.heroForeground]) {
    for (const candidate of asset.sources) {
      const bytes = await readFile(new URL(`../public${candidate.src}`, import.meta.url))
      assert.deepEqual(readWebPDimensions(bytes), expectedDimensions.get(candidate.width))
    }
  }
})

test('the page renders responsive rasters with stable dimensions and intentional loading priority', async () => {
  const previousWindow = globalThis.window
  globalThis.window = {
    location: { search: '' },
    matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
  }

  try {
    const { Site } = await import('../src/Site.jsx')
    const html = renderToStaticMarkup(React.createElement(Site))
    const rasterTags = [...html.matchAll(/<img\b[^>]+\.webp[^>]*>/g)].map(([tag]) => tag)

    assert.equal(rasterTags.length, 10)
    assert.equal(rasterTags.filter((tag) => tag.includes('fetchPriority="high"')).length, 3)
    const fallbackLayer = html.match(/<span class="hero__background hero__background--fallback"[^>]*>/)?.[0] ?? ''
    const skyLayer = html.match(/<span class="hero__depth-layer hero__depth-layer--sky"[^>]*data-depth-layer="sky"[^>]*>/)?.[0] ?? ''
    const foregroundLayer = html.match(/<span class="hero__depth-layer hero__depth-layer--foreground"[^>]*data-depth-layer="foreground"[^>]*>/)?.[0] ?? ''
    assert.doesNotMatch(fallbackLayer, /\bhidden(?:=|\b)/)
    assert.match(skyLayer, /\bhidden(?:=|\b)/)
    assert.match(foregroundLayer, /\bhidden(?:=|\b)/)
    assert.match(html, /class="hero__background hero__background--fallback"[^>]*><img[^>]+hero-3200\.webp[^>]+width="6668"[^>]+height="4993"[^>]+fetchPriority="high"/)
    assert.match(html, /data-depth-layer="sky"[^>]*><img[^>]+hero-sky-3200\.webp[^>]+sizes="100vw"[^>]+width="6668"[^>]+height="4993"[^>]+fetchPriority="high"/)
    assert.match(html, /data-depth-layer="foreground"[^>]*><img[^>]+hero-foreground-3200\.webp[^>]+sizes="100vw"[^>]+width="6668"[^>]+height="4993"[^>]+fetchPriority="high"/)
    assert.match(html, /data-motion-group="heading"[\s\S]+data-motion-group="support"[\s\S]+data-motion-group="specs"[\s\S]+data-motion-group="lower-left"[\s\S]+data-motion-group="outcomes"/)
    assert.match(html, /class="count-up-metric"[^>]+aria-label="30%"/)
    assert.match(html, /class="count-up-metric"[^>]+aria-label="2\.5x"[\s\S]+class="count-up-metric__measure"[^>]*>2\.5x<[\s\S]+class="count-up-metric__reserve"[^>]*>0\.0x</)

    const how = [...html.matchAll(/<img class="how__image"[^>]*>/g)].map(([tag]) => tag)
    assert.equal(how.length, 4)
    how.forEach((tag, index) => {
      assert.match(tag, /loading="lazy"/)
      assert.match(tag, /decoding="async"/)
      assert.match(tag, /width="\d+"/)
      assert.match(tag, /height="\d+"/)
      if (index < 2) {
        assert.match(tag, /data-image-delivery="loaded"/)
        assert.match(tag, /src="[^\"]+\.webp"/)
        assert.match(tag, /srcSet=/)
        assert.match(tag, /sizes=/)
      } else {
        assert.match(tag, /data-image-delivery="deferred"/)
        assert.doesNotMatch(tag, /\ssrc=/)
        assert.doesNotMatch(tag, /\ssrcSet=/)
        assert.doesNotMatch(tag, /\ssizes=/)
      }
    })

    const qaRuntime = await readFile(new URL('../src/qaRuntime.js', import.meta.url), 'utf8')
    assert.match(qaRuntime, /img\[data-image-delivery="deferred"\]:not\(\[src\]\)/)

    const technology = rasterTags.find((tag) => tag.includes('MO/GO powered wearable support system')) ?? ''
    assert.match(technology, /loading="lazy"/)
    assert.match(technology, /srcSet=/)

    const portraits = rasterTags.filter((tag) => tag.includes('testimonial-'))
    assert.equal(portraits.length, 3)
    portraits.forEach((tag) => assert.match(tag, /loading="lazy"/))

    const footer = rasterTags.find((tag) => tag.includes('footer__background')) ?? ''
    assert.match(footer, /src="\/assets\/skip\/optimized\/footer-1721\.webp"/)
    assert.match(footer, /loading="lazy"/)
    assert.match(footer, /width="1721"/)
    assert.match(footer, /height="914"/)
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})

test('the shared pre-order modal delivers a responsive WebP without changing dialog behavior', async () => {
  const { PreOrderModal } = await import('../src/PreOrderModal.jsx')
  const html = renderToStaticMarkup(React.createElement(PreOrderModal, {
    open: true,
    backgroundImage: ASSETS.preorderModalBackground,
    onRequestClose() {},
  }))

  const image = html.match(/<img\b[^>]+modal-[^>]+>/)?.[0] ?? ''
  assert.match(image, /src="\/assets\/skip\/optimized\/modal-3200\.webp"/)
  assert.match(image, /srcSet="[^"]+modal-800\.webp 800w[^"]+modal-3200\.webp 3200w"/)
  assert.match(image, /sizes="[^"]+"/)
  assert.match(image, /width="4340"/)
  assert.match(image, /height="3784"/)
  assert.match(image, /decoding="async"/)
  assert.match(html, /role="dialog"/)
})
