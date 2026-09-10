import {createClient} from '@sanity/client'

export const DEFAULT_SANITY_DATASET = 'production'
export const DEFAULT_SANITY_API_VERSION = '2025-02-19'
export const DEFAULT_SANITY_PROJECT_ID = '3g1ua4nm'

export function readSanityConfig(environment = process.env) {
  return {
    projectId: environment.SANITY_PROJECT_ID?.trim() || DEFAULT_SANITY_PROJECT_ID,
    dataset: environment.SANITY_DATASET?.trim() || DEFAULT_SANITY_DATASET,
    apiVersion: environment.SANITY_API_VERSION?.trim() || DEFAULT_SANITY_API_VERSION,
    token: environment.SANITY_READ_TOKEN?.trim() || undefined,
  }
}

export function createSanityContentClient(config = readSanityConfig()) {
  if (!config.projectId) {
    throw new Error('SANITY_PROJECT_ID is required to synchronize published content.')
  }

  return createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: config.apiVersion,
    token: config.token,
    perspective: 'published',
    useCdn: false,
  })
}
