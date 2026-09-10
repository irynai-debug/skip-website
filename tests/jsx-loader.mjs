import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'
import { transformSync } from 'esbuild'

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.css')) {
      return {
        format: 'module',
        shortCircuit: true,
        source: 'export default {}',
      }
    }

    if (!url.endsWith('.jsx')) return nextLoad(url, context)

    const sourcefile = fileURLToPath(url)
    const { code } = transformSync(readFileSync(sourcefile, 'utf8'), {
      format: 'esm',
      jsx: 'automatic',
      loader: 'jsx',
      sourcefile,
      sourcemap: 'inline',
      supported: { 'import-attributes': true },
      target: 'es2022',
    })

    return {
      format: 'module',
      shortCircuit: true,
      source: code,
    }
  },
})
