import { normalizeBasePath } from './src/assetPath.js'

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? '')
const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX?.trim() || basePath || undefined
const buildId = process.env.NEXT_BUILD_ID?.trim() || 'skip-mogo-static-v1'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  assetPrefix,
  generateBuildId: async () => buildId,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
