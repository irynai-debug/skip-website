import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, isAbsolute, relative, resolve } from 'node:path'

const MIME_TYPES = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
})

const exportRoot = resolve(process.argv[2] ?? 'out')
const port = Number(process.env.PORT ?? 4173)

function resolveRequestPath(pathname) {
  const decoded = decodeURIComponent(pathname)
  const requestPath = decoded.endsWith('/') ? `${decoded}index.html` : decoded
  const target = resolve(exportRoot, `.${requestPath}`)
  const relation = relative(exportRoot, target)

  if (relation.startsWith('..') || isAbsolute(relation)) return null
  return target
}

async function findStaticFile(pathname) {
  const direct = resolveRequestPath(pathname)
  const candidates = direct && extname(direct)
    ? [direct]
    : [direct, direct ? `${direct}.html` : null, direct ? resolve(direct, 'index.html') : null]

  for (const candidate of candidates.filter(Boolean)) {
    try {
      if ((await stat(candidate)).isFile()) return candidate
    } catch {}
  }
  return null
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname
  const requestedFile = await findStaticFile(pathname)
  const file = requestedFile ?? resolve(exportRoot, '404.html')
  const statusCode = requestedFile ? 200 : 404
  if (process.env.LOG_REQUESTS === '1') process.stdout.write(`${request.method ?? 'GET'} ${statusCode} ${pathname}\n`)

  try {
    const metadata = await stat(file)
    response.writeHead(statusCode, {
      'Content-Length': metadata.size,
      'Content-Type': MIME_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    })
    if (request.method === 'HEAD') response.end()
    else createReadStream(file).pipe(response)
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Not found')
  }
})

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Static export available at http://127.0.0.1:${port}\n`)
})
