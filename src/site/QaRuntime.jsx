'use client'

import { useEffect } from 'react'
import { DS_CONTRACT } from '../design-system/index.jsx'

export function QaRuntime() {
  useEffect(() => {
    window.SiteDesignSystemContract = DS_CONTRACT
    const searchParams = new URLSearchParams(window.location.search)
    if (process.env.NODE_ENV !== 'development' || !searchParams.get('qaAudit')) return

    import('../qaRuntime.js').then(({ runQaRuntime }) => runQaRuntime())
  }, [])

  return null
}
