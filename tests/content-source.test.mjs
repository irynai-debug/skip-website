import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

const contentUrl = new URL('../src/content.json', import.meta.url)
const snapshotUrl = new URL('../src/generated/content.json', import.meta.url)

const readPath = (value, path) => path.split('.').reduce((current, key) => current?.[key], value)

test('the offline fallback preserves the complete editorial shape used by Sanity sync', async () => {
  assert.equal(existsSync(contentUrl), true, 'src/content.json must remain available as fallback')

  const content = JSON.parse(await readFile(contentUrl, 'utf8'))
  assert.deepEqual(Object.keys(content), [
    'site',
    'navigation',
    'cta',
    'hero',
    'howItWorks',
    'technology',
    'testimonials',
    'footer',
    'cookieConsent',
    'preOrderModal',
    'notFound',
  ])

  for (const path of [
    'site.skipLink',
    'site.metadataTitle',
    'navigation.items.howItWorks',
    'cta.reserveSpot',
    'hero.title',
    'howItWorks.title',
    'technology.sectionTitle',
    'technology.image',
    'testimonials.items.0.quote',
    'testimonials.items.0.image',
    'testimonials.items.1.image',
    'testimonials.items.2.image',
    'footer.title',
    'cookieConsent.title',
    'preOrderModal.fields.email.label',
    'notFound.title',
  ]) {
    assert.equal(typeof readPath(content, path), 'string', `${path} must be editable text`)
  }

  assert.deepEqual([
    content.technology.image,
    ...content.testimonials.items.map(({ image }) => image),
  ], [
    '/assets/skip/optimized/technology-1536.webp',
    '/assets/skip/optimized/testimonial-daniel-384.webp',
    '/assets/skip/optimized/testimonial-maya-384.webp',
    '/assets/skip/optimized/testimonial-michael-384.webp',
  ])

  const editableImagePaths = new Set([
    'technology.image',
    'testimonials.items.0.image',
    'testimonials.items.1.image',
    'testimonials.items.2.image',
  ])
  const textEntries = []
  const visit = (value, path = []) => {
    if (typeof value === 'string') textEntries.push({ path: path.join('.'), value })
    else if (Array.isArray(value)) value.forEach((item, index) => visit(item, [...path, index]))
    else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => visit(item, [...path, key]))
  }
  visit(content)

  for (const entry of textEntries) {
    if (editableImagePaths.has(entry.path)) {
      assert.match(entry.value, /^\/(?:assets\/skip\/optimized|uploads)\/.+\.(?:avif|jpe?g|png|webp)$/i)
      continue
    }
    assert.doesNotMatch(
      entry.value,
      /(?:https?:\/\/|mailto:|\/(?:assets|uploads)\/|\.(?:avif|jpe?g|png|webp|svg|glb|otf|woff2?)$)/i,
      `${entry.path} must remain editable copy rather than a technical asset`,
    )
  }

  assert.equal(existsSync(snapshotUrl), true, 'Sanity sync must produce a build-time snapshot')
  const snapshot = JSON.parse(await readFile(snapshotUrl, 'utf8'))
  assert.deepEqual(Object.keys(snapshot), Object.keys(content))
})
