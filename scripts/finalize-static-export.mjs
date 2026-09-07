import { mkdir, rm, writeFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const STATIC_EXPORT_DIR = 'out'

export const STALE_PRODUCTION_PATHS = Object.freeze([
  '.site-builder',
  'assets/birdpulse',
  'assets/generated',
  'assets/skip/daniel-testimonial.png',
  'assets/skip/maya-testimonial.png',
  'assets/skip/michael-testimonial.png',
  'assets/skip/mogo-device.glb',
])

export function resolveInside(root, relativePath) {
  const resolvedRoot = resolve(root)
  const target = resolve(resolvedRoot, relativePath)
  const relation = relative(resolvedRoot, target)

  if (!relation || relation.startsWith('..') || isAbsolute(relation)) {
    throw new Error(`Refusing to write outside the static export: ${relativePath}`)
  }

  return target
}

export async function pruneAuditedOutputCopies(outputDirectory) {
  for (const relativePath of STALE_PRODUCTION_PATHS) {
    await rm(resolveInside(outputDirectory, relativePath), { recursive: true, force: true })
  }
}

export async function finalizeStaticExport(outputDirectory = STATIC_EXPORT_DIR) {
  const resolvedOutput = resolve(outputDirectory)
  await mkdir(resolvedOutput, { recursive: true })
  await pruneAuditedOutputCopies(resolvedOutput)
  await writeFile(resolveInside(resolvedOutput, '.nojekyll'), '', 'utf8')
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (invokedPath === import.meta.url) {
  await finalizeStaticExport(process.argv[2] ?? STATIC_EXPORT_DIR)
}
