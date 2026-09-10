const IMAGE_PATHS = new Set(['technology.image'])
const VARIABLE_LENGTH_ARRAY_RULES = new Map([
  ['testimonials.items', {min: 1}],
])

function isImagePath(path) {
  return IMAGE_PATHS.has(path) || /^testimonials\.items\.\d+\.image$/.test(path)
}

function invalid(path, expected) {
  return new TypeError(`Invalid Sanity content at ${path}: expected ${expected}.`)
}

function normalizeImage(remote, fallback, path, strict) {
  const url = typeof remote === 'string' ? remote : remote?.url
  if (typeof url === 'string' && url.trim()) return url
  if (strict) throw invalid(path, 'a published image asset')
  return fallback
}

function normalizeValue(remote, fallback, path, strict) {
  if (isImagePath(path)) return normalizeImage(remote, fallback, path, strict)

  if (typeof fallback === 'string') {
    if (typeof remote === 'string' && remote.trim()) return remote
    if (strict) throw invalid(path, 'a non-empty string')
    return fallback
  }

  if (Array.isArray(fallback)) {
    const variableLengthRule = VARIABLE_LENGTH_ARRAY_RULES.get(path)
    const hasInvalidLength = variableLengthRule
      ? !Array.isArray(remote) || remote.length < variableLengthRule.min
      : !Array.isArray(remote) || remote.length !== fallback.length

    if (hasInvalidLength) {
      const expected = variableLengthRule
        ? `an array with at least ${variableLengthRule.min} item`
        : `an array with ${fallback.length} items`
      if (strict) throw invalid(path, expected)
      return structuredClone(fallback)
    }

    return remote.map((item, index) =>
      normalizeValue(item, fallback[index] ?? fallback[0], `${path}.${index}`, strict),
    )
  }

  if (fallback && typeof fallback === 'object') {
    if (!remote || typeof remote !== 'object' || Array.isArray(remote)) {
      if (strict) throw invalid(path, 'an object')
      return structuredClone(fallback)
    }

    return Object.fromEntries(
      Object.entries(fallback).map(([key, fallbackValue]) => [
        key,
        normalizeValue(remote[key], fallbackValue, path ? `${path}.${key}` : key, strict),
      ]),
    )
  }

  return remote ?? fallback
}

export function normalizeSanityContent(remote, fallback, {strict = false} = {}) {
  if (!fallback || typeof fallback !== 'object' || Array.isArray(fallback)) {
    throw new TypeError('A complete fallback content object is required.')
  }

  if (!remote || typeof remote !== 'object' || Array.isArray(remote)) {
    if (strict) throw invalid('siteContent', 'a published singleton document')
    return structuredClone(fallback)
  }

  return normalizeValue(remote, fallback, '', strict)
}
