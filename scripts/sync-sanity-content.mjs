import nextEnv from '@next/env'
import {readFile, rename, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {createSanityContentClient, readSanityConfig} from '../src/sanity/config.js'
import {normalizeSanityContent} from '../src/sanity/normalizeContent.js'
import {SITE_CONTENT_QUERY} from '../src/sanity/query.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fallbackPath = path.join(projectRoot, 'src', 'content.json')
const snapshotPath = path.join(projectRoot, 'src', 'generated', 'content.json')
const temporaryPath = `${snapshotPath}.tmp`
const strict = process.argv.includes('--strict')

const {loadEnvConfig} = nextEnv

loadEnvConfig(projectRoot)

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function writeSnapshot(content) {
  const serialized = `${JSON.stringify(content, null, 2)}\n`
  await writeFile(temporaryPath, serialized, 'utf8')
  await readJson(temporaryPath)
  await rename(temporaryPath, snapshotPath)
}

async function synchronize() {
  const fallback = await readJson(fallbackPath)
  const config = readSanityConfig()

  try {
    const client = createSanityContentClient(config)
    const remote = await client.fetch(SITE_CONTENT_QUERY)
    const content = normalizeSanityContent(remote, fallback, {strict})
    await writeSnapshot(content)
    console.log(`Synchronized published Sanity content from ${config.projectId}/${config.dataset}.`)
  } catch (error) {
    if (strict) throw error

    try {
      await readJson(snapshotPath)
      console.warn(`Sanity sync skipped; preserving the last valid snapshot. ${error.message}`)
    } catch {
      await writeSnapshot(fallback)
      console.warn(`Sanity sync skipped; initialized the snapshot from fallback content. ${error.message}`)
    }
  }
}

await synchronize()
