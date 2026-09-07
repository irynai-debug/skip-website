import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))

async function fileManifest(root, relativePath = '') {
  const entries = await readdir(join(root, relativePath), { withFileTypes: true })
  const records = []

  for (const entry of entries) {
    const nextPath = relativePath ? `${relativePath}/${entry.name}` : entry.name
    if (entry.isDirectory()) records.push(...await fileManifest(root, nextPath))
    else {
      const bytes = await readFile(join(root, nextPath))
      records.push({
        path: nextPath.replaceAll('\\', '/'),
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      })
    }
  }

  return records.sort((left, right) => left.path.localeCompare(right.path))
}

test('static export finalization uses out and removes only audited stale public copies', async () => {
  const {
    STATIC_EXPORT_DIR,
    STALE_PRODUCTION_PATHS,
    finalizeStaticExport,
  } = await import('../scripts/finalize-static-export.mjs')

  assert.equal(STATIC_EXPORT_DIR, 'out')
  assert.deepEqual(STALE_PRODUCTION_PATHS, [
    '.site-builder',
    'assets/birdpulse',
    'assets/generated',
    'assets/skip/daniel-testimonial.png',
    'assets/skip/maya-testimonial.png',
    'assets/skip/michael-testimonial.png',
    'assets/skip/mogo-device.glb',
  ])

  const fixture = await mkdtemp(join(tmpdir(), 'skip-static-export-'))
  try {
    const staleFiles = [
      '.site-builder/qa-tools/design-system-audit.js',
      'assets/birdpulse/hero.webp',
      'assets/generated/legacy.webp',
      'assets/skip/daniel-testimonial.png',
      'assets/skip/maya-testimonial.png',
      'assets/skip/michael-testimonial.png',
      'assets/skip/mogo-device.glb',
    ]
    const requiredFile = 'assets/skip/optimized/hero-1600.webp'

    for (const relativePath of [...staleFiles, requiredFile]) {
      const target = join(fixture, relativePath)
      await mkdir(join(target, '..'), { recursive: true })
      await writeFile(target, relativePath)
    }

    await finalizeStaticExport(fixture)

    for (const relativePath of staleFiles) {
      await assert.rejects(stat(join(fixture, relativePath)), { code: 'ENOENT' })
    }
    assert.equal(await readFile(join(fixture, requiredFile), 'utf8'), requiredFile)
    assert.equal(await readFile(join(fixture, '.nojekyll'), 'utf8'), '')
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
})

test('Next production configuration preserves static-export and GitHub Pages contracts', async () => {
  const [{ default: nextConfig }, packageJson] = await Promise.all([
    import('../next.config.mjs'),
    readFile(new URL('../package.json', import.meta.url), 'utf8').then(JSON.parse),
  ])

  assert.equal(nextConfig.output, 'export')
  assert.equal(nextConfig.trailingSlash, true)
  assert.equal(nextConfig.images.unoptimized, true)
  assert.match(packageJson.scripts.build, /^next build/)
  assert.doesNotMatch(packageJson.scripts.build, /vite/)
  assert.equal(packageJson.dependencies.next, '16.3.4')
})

test('production source assets remain byte-identical when a separate export is finalized', async () => {
  const { finalizeStaticExport } = await import('../scripts/finalize-static-export.mjs')
  const publicBefore = await fileManifest(join(projectRoot, 'public'))
  const fixture = await mkdtemp(join(tmpdir(), 'skip-static-export-source-safety-'))

  try {
    await finalizeStaticExport(fixture)
    assert.deepEqual(await fileManifest(join(projectRoot, 'public')), publicBefore)
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
})

test('the export verifier resolves encoded inline assets and rejects no valid local references', async () => {
  const [verifierSource, { verifyNextExport }] = await Promise.all([
    readFile(new URL('../scripts/verify-next-export.mjs', import.meta.url), 'utf8'),
    import('../scripts/verify-next-export.mjs'),
  ])
  const fixture = await mkdtemp(join(tmpdir(), 'skip-static-export-verifier-'))
  const files = {
    '.nojekyll': '',
    'index.html': '<main style="--icon:url(&quot;/assets/skip/icons/arrow.svg&quot;)"><img src="/assets/skip/image.webp"></main>',
    '404.html': '<a href="/">Home</a>',
    '_design-system/index.html': '<link href="/_next/static/css/site.css" rel="stylesheet">',
    '_next/static/css/site.css': '@font-face{src:url(../../media/font.otf)}',
    '_next/media/font.otf': 'font',
    'assets/skip/icons/arrow.svg': '<svg></svg>',
    'assets/skip/image.webp': 'image',
    'assets/skip/mogo-device.meshopt.glb': 'model',
  }

  try {
    assert.match(verifierSource, /relative\(outputPath, absolute\)/)
    assert.match(verifierSource, /isAbsolute\(relativeCandidate\)/)
    assert.doesNotMatch(verifierSource, /outputPath}\\\\/)
    for (const [relativePath, content] of Object.entries(files)) {
      const target = join(fixture, relativePath)
      await mkdir(join(target, '..'), { recursive: true })
      await writeFile(target, content)
    }
    const report = await verifyNextExport({ projectPath: fixture, outputDirectory: '.' })
    assert.equal(report.ok, true)
    assert.deepEqual(report.missingReferences, [])
    assert.deepEqual(report.outsideBasePath, [])
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
})
