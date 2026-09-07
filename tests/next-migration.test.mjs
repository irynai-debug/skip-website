import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile as execFileCallback } from 'node:child_process'
import { createHash } from 'node:crypto'
import { access, mkdtemp, readFile, readdir, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const projectRoot = new URL('..', import.meta.url)
const projectPath = fileURLToPath(projectRoot)
const execFile = promisify(execFileCallback)

async function exists(url) {
  try {
    await access(url)
    return true
  } catch {
    return false
  }
}

test('Next configuration produces a GitHub-Pages-safe static export', async () => {
  const configUrl = new URL('../next.config.mjs', import.meta.url)
  assert.equal(await exists(configUrl), true, 'next.config.mjs must exist')

  const { default: exportedConfig } = await import(configUrl)
  const config = typeof exportedConfig === 'function'
    ? exportedConfig('phase-production-build')
    : exportedConfig

  assert.equal(config.output, 'export')
  assert.equal(config.trailingSlash, true)
  assert.equal(config.images?.unoptimized, true)
  assert.equal(await config.generateBuildId(), 'skip-mogo-static-v1')
})

test('the App Router metadata points browsers at an existing basePath-aware project icon', async () => {
  const layoutSource = await readFile(new URL('../app/layout.jsx', import.meta.url), 'utf8')
  assert.match(layoutSource, /import \{ assetPath \} from '\.\.\/src\/assetPath\.js'/)
  assert.match(layoutSource, /icons:\s*\{\s*icon:\s*assetPath\('\/assets\/skip\/icons\/Logo\.svg'\)/s)
})

test('asset paths support a configured subpath without rewriting external or hash URLs', async () => {
  const helperUrl = new URL('../src/assetPath.js', import.meta.url)
  assert.equal(await exists(helperUrl), true, 'src/assetPath.js must exist')

  const { createAssetPath } = await import(helperUrl)
  const withRepoBase = createAssetPath({ basePath: '/skip-preview/' })

  assert.equal(withRepoBase('/assets/skip/hero.webp'), '/skip-preview/assets/skip/hero.webp')
  assert.equal(withRepoBase('/skip-preview/assets/skip/hero.webp'), '/skip-preview/assets/skip/hero.webp')
  assert.equal(withRepoBase('#technology'), '#technology')
  assert.equal(withRepoBase('https://example.com/image.webp'), 'https://example.com/image.webp')
  assert.equal(withRepoBase('mailto:hello@example.com'), 'mailto:hello@example.com')
})

test('responsive descriptors and model URLs inherit the configured base path', async () => {
  const probe = [
    "import('./src/siteContent.js').then(({ ASSETS }) => {",
    "console.log(JSON.stringify({ hero: ASSETS.heroBackground, how: ASSETS.howItWorks, model: ASSETS.technologyModel }))",
    '})',
  ].join('')
  const { stdout } = await execFile(process.execPath, ['--input-type=module', '--eval', probe], {
    cwd: projectPath,
    env: { ...process.env, NEXT_PUBLIC_BASE_PATH: '/skip-preview' },
  })
  const assets = JSON.parse(stdout)

  assert.equal(assets.hero.src, '/skip-preview/assets/skip/optimized/hero-3200.webp')
  assert.ok(assets.hero.srcSet.split(', ').every((candidate) => candidate.startsWith('/skip-preview/assets/')))
  assert.equal(assets.hero.sizes, '(max-width: 820px) 100vw, 1600px')
  assert.equal(assets.how.length, 4)
  assert.ok(assets.how.every(({ src, srcSet }) => src.startsWith('/skip-preview/assets/') && srcSet.includes('/skip-preview/assets/')))
  assert.equal(assets.model, '/skip-preview/assets/skip/mogo-device.meshopt.glb')
})

test('project-owned icon and font copies remain byte-identical to input sources', async () => {
  const pairs = [
    ['input/Logo.svg', 'public/assets/skip/icons/Logo.svg'],
    ['input/basket.svg', 'public/assets/skip/icons/basket.svg'],
    ['input/Neue Haas Grotesk Display Pro 55 Roman.otf', 'src/design-system/fonts/Neue Haas Grotesk Display Pro 55 Roman.otf'],
  ]

  for (const [sourcePath, copyPath] of pairs) {
    const sourceUrl = new URL(`../${sourcePath}`, import.meta.url)
    const copyUrl = new URL(`../${copyPath}`, import.meta.url)
    assert.equal(await exists(copyUrl), true, `${copyPath} must exist`)
    const [source, copy] = await Promise.all([readFile(sourceUrl), readFile(copyUrl)])
    const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
    assert.equal(digest(copy), digest(source), `${copyPath} must be byte-identical`)
  }
})

test('App Router exposes both static routes without turning the site shell into a client component', async () => {
  const pageUrl = new URL('../app/page.jsx', import.meta.url)
  const catalogueUrl = join(projectPath, 'app', '%5Fdesign-system', 'page.jsx')
  assert.equal(await exists(pageUrl), true, 'app/page.jsx must exist')
  assert.equal(await exists(catalogueUrl), true, 'app/%5Fdesign-system/page.jsx must exist so /_design-system is exported')

  const siteSource = await readFile(new URL('../src/Site.jsx', import.meta.url), 'utf8')
  const catalogueSource = await readFile(catalogueUrl, 'utf8')
  const qaRuntimeSource = await readFile(new URL('../src/site/QaRuntime.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(siteSource, /^\s*['"]use client['"]/) 
  assert.match(catalogueSource, /<QaRuntime \/>/)
  assert.match(qaRuntimeSource, /window\.SiteDesignSystemContract = DS_CONTRACT/)
})

test('production build and test inputs are reproducible from a normal checkout', async () => {
  const [packageJson, gitignore] = await Promise.all([
    readFile(new URL('../package.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../.gitignore', import.meta.url), 'utf8'),
  ])

  assert.equal(packageJson.scripts.prebuild, undefined, 'production build must not copy development QA artifacts')
  assert.match(packageJson.scripts.test, /next build/)
  assert.match(packageJson.scripts.test, /verify-next-export\.mjs/)
  assert.match(packageJson.scripts.verify, /next build/)
  assert.match(packageJson.scripts.verify, /verify-next-export\.mjs/)
  assert.equal(await exists(new URL('../scripts/verify-next-export.mjs', import.meta.url)), true)
  assert.match(gitignore, /!\.site-builder\/qa-tools\//)
  assert.match(gitignore, /!\.site-builder\/motion\.json/)
  assert.match(gitignore, /!\.site-builder\/audits\/production-performance\/glb-comparison\.json/)
})

test('static footer and design-system catalogue stay outside broad client boundaries', async () => {
  const [siteSource, interactiveSource, footerSource, gallerySource] = await Promise.all([
    readFile(new URL('../src/Site.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/site/InteractiveSections.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/site/Footer.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/design-system/Gallery.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(siteSource, /from '\.\/site\/Footer\.jsx'/)
  assert.doesNotMatch(interactiveSource, /export function Footer\(/)
  assert.doesNotMatch(footerSource, /^\s*['"]use client['"]/)
  assert.doesNotMatch(gallerySource, /^\s*['"]use client['"]/)
  assert.doesNotMatch(gallerySource, /typeof window/)
})

test('development QA assets mirror every runtime audit dependency', async () => {
  const mirroredQaAssets = [
    ['.site-builder/qa-tools/design-system-audit.js', 'public/.site-builder/qa-tools/design-system-audit.js'],
    ['.site-builder/qa-tools/motion-smoke-test.js', 'public/.site-builder/qa-tools/motion-smoke-test.js'],
    ['.site-builder/qa-tools/typography-audit.js', 'public/.site-builder/qa-tools/typography-audit.js'],
    ['.site-builder/motion.json', 'public/.site-builder/motion.json'],
  ]

  for (const [sourcePath, publicPath] of mirroredQaAssets) {
    const [source, publicCopy] = await Promise.all([
      readFile(new URL(`../${sourcePath}`, import.meta.url)),
      readFile(new URL(`../${publicPath}`, import.meta.url)),
    ])
    assert.deepEqual(publicCopy, source, `${publicPath} must exactly mirror ${sourcePath}`)
  }
})

test('static export finalization creates .nojekyll and removes only audited stale copies', async () => {
  const finalizerUrl = new URL('../scripts/finalize-static-export.mjs', import.meta.url)
  assert.equal(await exists(finalizerUrl), true, 'scripts/finalize-static-export.mjs must exist')

  const { finalizeStaticExport, STALE_PRODUCTION_PATHS } = await import(finalizerUrl)
  const fixture = await mkdtemp(join(tmpdir(), 'skip-next-export-'))
  const required = join(fixture, 'assets', 'skip', 'optimized', 'hero-800.webp')
  const stale = join(fixture, 'assets', 'generated', 'legacy.webp')
  await import('node:fs/promises').then(({ mkdir, writeFile }) => Promise.all([
    mkdir(join(required, '..'), { recursive: true }).then(() => writeFile(required, 'required')),
    mkdir(join(stale, '..'), { recursive: true }).then(() => writeFile(stale, 'stale')),
  ]))

  await finalizeStaticExport(fixture)

  assert.equal(await readFile(required, 'utf8'), 'required')
  assert.equal(await readFile(join(fixture, '.nojekyll'), 'utf8'), '')
  await assert.rejects(stat(stale), { code: 'ENOENT' })
  assert.ok(STALE_PRODUCTION_PATHS.includes('assets/generated'))
  assert.deepEqual(await readdir(join(fixture, 'assets', 'skip', 'optimized')), ['hero-800.webp'])
})

test('migration keeps the approved image-loading and 3D boundaries', async () => {
  const { Site } = await import(new URL('../src/Site.jsx', import.meta.url))
  const html = renderToStaticMarkup(React.createElement(Site))
  const siteSource = await readFile(new URL('../src/site/InteractiveSections.jsx', import.meta.url), 'utf8')
  const mediaSource = await readFile(new URL('../src/TechnologyMedia.js', import.meta.url), 'utf8')
  const viewerSource = await readFile(new URL('../src/TechnologyModelViewer.js', import.meta.url), 'utf8')
  const triggerValues = [...html.matchAll(/data-preorder-trigger="([^"]+)"/g)].map((match) => match[1])

  assert.deepEqual(triggerValues.sort(), ['footer', 'header', 'hero', 'how-it-works'])
  assert.match(siteSource, /fetchPriority="high"/)
  assert.match(siteSource, /loading="eager"/)
  assert.match(siteSource, /srcSet=/)
  assert.match(siteSource, /sizes=/)
  assert.match(mediaSource, /rootMargin:\s*['"]480px/)
  assert.match(viewerSource, /import\(['"]three['"]\)/)
  assert.match(viewerSource, /GLTFLoader/)
  assert.match(viewerSource, /Meshopt/)
})
