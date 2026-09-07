const EXTERNAL_OR_FRAGMENT = /^(?:[a-z]+:|#|\/\/)/i

export function normalizeBasePath(value = '') {
  const trimmed = String(value).trim()
  if (!trimmed || trimmed === '/') return ''
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`
}

export function createAssetPath({ basePath = '' } = {}) {
  const prefix = normalizeBasePath(basePath)

  return (url) => {
    if (!url || EXTERNAL_OR_FRAGMENT.test(url)) return url
    const path = url.startsWith('/') ? url : `/${url}`
    if (!prefix || path === prefix || path.startsWith(`${prefix}/`)) return path
    return `${prefix}${path}`
  }
}

export const assetPath = createAssetPath({
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
})
