import assert from 'node:assert/strict'
import test from 'node:test'
import {access, readdir, readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import fallback from '../src/content.json' with {type: 'json'}
import {
  DEFAULT_SANITY_PROJECT_ID,
  readSanityConfig,
} from '../src/sanity/config.js'
import {SITE_CONTENT_QUERY} from '../src/sanity/query.js'
import {normalizeSanityContent} from '../src/sanity/normalizeContent.js'

function validRemoteContent() {
  const remote = structuredClone(fallback)
  remote.hero.title = 'REMOTE HERO\nTITLE'
  remote.technology.image = {
    url: 'https://cdn.sanity.io/images/abc123/production/technology.webp',
  }
  remote.testimonials.items = remote.testimonials.items.map((item, index) => ({
    ...item,
    image: {
      url: `https://cdn.sanity.io/images/abc123/production/testimonial-${index + 1}.webp`,
    },
  }))
  return remote
}

test('the public production Sanity coordinates work without repository variables', () => {
  assert.equal(DEFAULT_SANITY_PROJECT_ID, '3g1ua4nm')
  assert.deepEqual(readSanityConfig({}), {
    projectId: '3g1ua4nm',
    dataset: 'production',
    apiVersion: '2025-02-19',
    token: undefined,
  })
})

test('valid Sanity content becomes the complete runtime snapshot with CDN image URLs', () => {
  const content = normalizeSanityContent(validRemoteContent(), fallback, {strict: true})

  assert.equal(content.hero.title, 'REMOTE HERO\nTITLE')
  assert.equal(
    content.technology.image,
    'https://cdn.sanity.io/images/abc123/production/technology.webp',
  )
  assert.deepEqual(
    content.testimonials.items.map(({image}) => image),
    [
      'https://cdn.sanity.io/images/abc123/production/testimonial-1.webp',
      'https://cdn.sanity.io/images/abc123/production/testimonial-2.webp',
      'https://cdn.sanity.io/images/abc123/production/testimonial-3.webp',
    ],
  )
})

test('ordinary local normalization preserves project-owned image fallbacks when an image is absent', () => {
  const remote = validRemoteContent()
  delete remote.technology.image
  delete remote.testimonials.items[1].image

  const content = normalizeSanityContent(remote, fallback)

  assert.equal(content.technology.image, '/assets/skip/optimized/technology-1536.webp')
  assert.equal(
    content.testimonials.items[1].image,
    '/assets/skip/optimized/testimonial-maya-384.webp',
  )
})

test('strict normalization rejects incomplete published content instead of deploying a stale page', () => {
  const remote = validRemoteContent()
  remote.navigation.items.product = ''

  assert.throws(
    () => normalizeSanityContent(remote, fallback, {strict: true}),
    /navigation\.items\.product/,
  )
})

test('the singleton GROQ query dereferences every editable image asset', () => {
  assert.match(SITE_CONTENT_QUERY, /\*\[_type\s*==\s*"siteContent"\s*&&\s*_id\s*==\s*"siteContent"\]\[0\]/)
  assert.match(SITE_CONTENT_QUERY, /technology\s*\{[\s\S]*image\s*\{[\s\S]*asset->url/)
  assert.match(SITE_CONTENT_QUERY, /testimonials\s*\{[\s\S]*items\[\][\s\S]*image\s*\{[\s\S]*asset->url/)
})

async function sourceFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true})
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(target)
    return /\.(?:js|jsx)$/.test(entry.name) ? [target] : []
  }))
  return nested.flat()
}

test('production modules consume only the generated Sanity snapshot', async () => {
  const files = [
    ...(await sourceFiles(fileURLToPath(new URL('../app', import.meta.url)))),
    ...(await sourceFiles(fileURLToPath(new URL('../src', import.meta.url)))),
  ]
  const fallbackImports = []

  for (const file of files) {
    const source = await readFile(file, 'utf8')
    if (
      /from\s+['"][^'"]*content\.json['"]/.test(source) &&
      !/from\s+['"][^'"]*generated\/content\.json['"]/.test(source)
    ) {
      fallbackImports.push(file)
    }
  }

  assert.deepEqual(fallbackImports, [])
})

test('GitHub Pages rebuilds published Sanity content before the static export', async () => {
  const workflow = await readFile(
    new URL('../.github/workflows/deploy.yml', import.meta.url),
    'utf8',
  )
  const syncIndex = workflow.indexOf('pnpm run content:sync -- --strict')
  const buildIndex = workflow.indexOf('pnpm run build')

  assert.match(workflow, /repository_dispatch:/)
  assert.match(workflow, /types:\s*\[\s*sanity-content-updated\s*\]/)
  assert.ok(syncIndex >= 0, 'Expected a strict Sanity sync step')
  assert.ok(buildIndex > syncIndex, 'Sanity synchronization must finish before build')
})

test('Pages CMS is removed from the production editing path', async () => {
  await assert.rejects(access(new URL('../.pages.yml', import.meta.url)))
})
