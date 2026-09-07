import { access, readFile, readdir, stat } from 'node:fs/promises'
import { isAbsolute, join, posix, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
export const STATIC_EXPORT_DIR = 'out'

const normalizeBasePath = (value = '') => {
  const trimmed = String(value).trim()
  if (!trimmed || trimmed === '/') return ''
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function walk(root, relativePath = '') {
  const directory = join(root, relativePath)
  const entries = await readdir(directory, { withFileTypes: true })
  const paths = []
  for (const entry of entries) {
    const child = relativePath ? posix.join(relativePath, entry.name) : entry.name
    if (entry.isDirectory()) paths.push(...await walk(root, child))
    else paths.push(child)
  }
  return paths.sort()
}

function extractReferences(source, relativeSourcePath) {
  const references = []
  for (const match of source.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) references.push(match[1])
  for (const match of source.matchAll(/\bsrcset=["']([^"']+)["']/gi)) {
    match[1].split(',').forEach((candidate) => references.push(candidate.trim().split(/\s+/)[0]))
  }
  for (const match of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) references.push(match[1])
  return references.map((reference) => ({ reference, relativeSourcePath }))
}

function cleanReference(value) {
  let decoded = value
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&')
    .trim()
  if ((decoded.startsWith('"') && decoded.endsWith('"')) || (decoded.startsWith("'") && decoded.endsWith("'"))) {
    decoded = decoded.slice(1, -1).trim()
  }
  if (!decoded || decoded.startsWith('#') || /^(?:data:|https?:|mailto:|tel:|javascript:)/i.test(decoded)) return null
  const withoutFragment = decoded.split('#')[0].split('?')[0]
  if (!withoutFragment) return null
  try {
    return decodeURIComponent(withoutFragment)
  } catch {
    return withoutFragment
  }
}

async function resolveExportReference({ outputPath, basePath, reference, relativeSourcePath }) {
  const cleaned = cleanReference(reference)
  if (!cleaned) return null
  let exportRelative
  if (cleaned.startsWith('/')) {
    if (basePath && cleaned !== basePath && !cleaned.startsWith(`${basePath}/`)) {
      return { status: 'outside-base-path', cleaned }
    }
    exportRelative = basePath ? cleaned.slice(basePath.length) : cleaned
    exportRelative = exportRelative.replace(/^\/+/, '')
  } else {
    exportRelative = posix.normalize(posix.join(posix.dirname(relativeSourcePath), cleaned))
  }

  const candidates = exportRelative
    ? [exportRelative, posix.join(exportRelative, 'index.html')]
    : ['index.html']
  for (const candidate of candidates) {
    const absolute = resolve(outputPath, candidate)
    const relativeCandidate = relative(outputPath, absolute)
    if (relativeCandidate.startsWith('..') || isAbsolute(relativeCandidate)) continue
    if (await exists(absolute) && (await stat(absolute)).isFile()) return { status: 'resolved', candidate }
  }
  return { status: 'missing', cleaned, candidates }
}

export async function verifyNextExport({
  projectPath = projectRoot,
  outputDirectory = STATIC_EXPORT_DIR,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH,
} = {}) {
  const outputPath = resolve(projectPath, outputDirectory)
  const normalizedBasePath = normalizeBasePath(basePath)
  const required = [
    '.nojekyll',
    'index.html',
    '404.html',
    '_design-system/index.html',
    'assets/skip/mogo-device.meshopt.glb',
  ]
  const missingRequired = []
  for (const relativePath of required) {
    if (!await exists(join(outputPath, relativePath))) missingRequired.push(relativePath)
  }

  const files = await walk(outputPath)
  const sourceFiles = files.filter((path) => /\.(?:html|css)$/.test(path))
  const references = []
  for (const relativeSourcePath of sourceFiles) {
    const source = await readFile(join(outputPath, relativeSourcePath), 'utf8')
    references.push(...extractReferences(source, relativeSourcePath))
  }

  const missingReferences = []
  const outsideBasePath = []
  for (const item of references) {
    const result = await resolveExportReference({ outputPath, basePath: normalizedBasePath, ...item })
    if (result?.status === 'missing') missingReferences.push({ ...item, ...result })
    if (result?.status === 'outside-base-path') outsideBasePath.push({ ...item, ...result })
  }

  const forbiddenImageOptimizerReferences = references.filter(({ reference }) => reference.includes('/_next/image'))
  const forbiddenProductionPaths = files.filter((path) => path.startsWith('.site-builder/') || path.startsWith('assets/generated/') || path.startsWith('assets/birdpulse/'))
  const report = {
    ok: missingRequired.length === 0 && missingReferences.length === 0 && outsideBasePath.length === 0 && forbiddenImageOptimizerReferences.length === 0 && forbiddenProductionPaths.length === 0,
    outputDirectory,
    basePath: normalizedBasePath,
    fileCount: files.length,
    checkedSourceFiles: sourceFiles.length,
    checkedReferences: references.length,
    missingRequired,
    missingReferences,
    outsideBasePath,
    forbiddenImageOptimizerReferences,
    forbiddenProductionPaths,
  }
  return report
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const report = await verifyNextExport()
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  if (!report.ok) process.exitCode = 1
}
