import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export const QA_ASSET_PAIRS = Object.freeze([
  ['.site-builder/qa-tools/design-system-audit.js', 'public/.site-builder/qa-tools/design-system-audit.js'],
  ['.site-builder/qa-tools/motion-smoke-test.js', 'public/.site-builder/qa-tools/motion-smoke-test.js'],
  ['.site-builder/qa-tools/typography-audit.js', 'public/.site-builder/qa-tools/typography-audit.js'],
  ['.site-builder/motion.json', 'public/.site-builder/motion.json'],
])

export async function syncDevelopmentQaAssets() {
  for (const [sourcePath, publicPath] of QA_ASSET_PAIRS) {
    const source = resolve(projectRoot, sourcePath)
    const destination = resolve(projectRoot, publicPath)
    await mkdir(dirname(destination), { recursive: true })
    await copyFile(source, destination)
  }
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  await syncDevelopmentQaAssets()
}
