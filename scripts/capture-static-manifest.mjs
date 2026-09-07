import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

async function collectFiles(directory, root = directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const absolutePath = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collectFiles(absolutePath, root))
    if (entry.isFile()) files.push(relative(root, absolutePath).replaceAll('\\', '/'))
  }

  return files.sort()
}

export async function captureStaticManifest(outputDirectory = 'out', manifestPath) {
  if (!manifestPath) throw new Error('A manifest output path is required')
  const root = resolve(outputDirectory)
  const files = await collectFiles(root)
  const entries = []

  for (const file of files) {
    const absolutePath = resolve(root, file)
    const bytes = await readFile(absolutePath)
    entries.push({
      file,
      bytes: (await stat(absolutePath)).size,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    })
  }

  const manifest = {
    fileCount: entries.length,
    bytes: entries.reduce((total, entry) => total + entry.bytes, 0),
    entries,
  }
  const destination = resolve(manifestPath)
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  return manifest
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (invokedPath === import.meta.url) {
  await captureStaticManifest(process.argv[2] ?? 'out', process.argv[3])
}
