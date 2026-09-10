import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

const contentUrl = new URL('../src/content.json', import.meta.url)
const pagesConfigUrl = new URL('../.pages.yml', import.meta.url)
const uploadsRootUrl = new URL('../public/uploads/', import.meta.url)

const readPath = (value, path) => path.split('.').reduce((current, key) => current?.[key], value)

test('editable production copy is exposed through one CMS-ready JSON source', async () => {
  assert.equal(existsSync(contentUrl), true, 'src/content.json must own editable production copy')

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
})

test('Pages CMS exposes dedicated upload controls for the editable site images', async () => {
  const config = await readFile(pagesConfigUrl, 'utf8')

  assert.equal(existsSync(uploadsRootUrl), true, 'public/uploads must be tracked for CMS media')
  assert.match(config, /media:\s*\r?\n\s+- name: site_images[\s\S]*?input: public\/uploads[\s\S]*?output: \/uploads/)
  assert.equal((config.match(/\btype: image\b/g) ?? []).length, 2)
  assert.equal((config.match(/\bmedia: site_images\b/g) ?? []).length, 2)
  assert.match(config, /path: public\/uploads\/technology/)
  assert.match(config, /path: public\/uploads\/testimonials/)
})
