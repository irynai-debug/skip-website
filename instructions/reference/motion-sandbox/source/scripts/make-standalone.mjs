import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = resolve(projectRoot, 'dist')
const builtHtmlPath = resolve(distRoot, 'app.html')

let html = await readFile(builtHtmlPath, 'utf8')
const stylesheet = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/)
const moduleScript = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"[^>]*><\/script>/)

if (!stylesheet || !moduleScript) throw new Error('Vite output is missing CSS or JavaScript')

const resolveOutput = (reference) => resolve(distRoot, reference.replace(/^\.\//, ''))
const css = await readFile(resolveOutput(stylesheet[1]), 'utf8')
const javascript = await readFile(resolveOutput(moduleScript[1]), 'utf8')

html = html
  .replace(stylesheet[0], () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`)
  .replace(moduleScript[0], () => `<script type="module">${javascript.replace(/<\/script/gi, '<\\/script')}</script>`)

await writeFile(resolve(projectRoot, '..', 'index.html'), html)
