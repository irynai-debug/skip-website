import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

const contentUrl = new URL('../src/content.json', import.meta.url)

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
    'testimonials.items.0.quote',
    'footer.title',
    'cookieConsent.title',
    'preOrderModal.fields.email.label',
    'notFound.title',
  ]) {
    assert.equal(typeof readPath(content, path), 'string', `${path} must be editable text`)
  }

  const textValues = []
  const visit = (value) => {
    if (typeof value === 'string') textValues.push(value)
    else if (Array.isArray(value)) value.forEach(visit)
    else if (value && typeof value === 'object') Object.values(value).forEach(visit)
  }
  visit(content)

  assert.equal(
    textValues.some((value) => /(?:https?:\/\/|mailto:|\/assets\/|\.(?:png|webp|svg|glb|otf|woff2?)$)/i.test(value)),
    false,
    'content.json must not contain destinations, asset paths, fonts, or models',
  )
})
