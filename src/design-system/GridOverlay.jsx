'use client'

import React, { useEffect, useState } from 'react'

const readActiveGridColumns = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0
  const value = Number.parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--ds-grid-columns'), 10)
  return Number.isInteger(value) && value > 0 ? value : 0
}

export function GridOverlay({ visible = false }) {
  const [columns, setColumns] = useState(readActiveGridColumns)

  useEffect(() => {
    const sync = () => setColumns(readActiveGridColumns())
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  if (!visible) return null
  return <div className="ds-grid-overlay" aria-hidden="true"><span className="ds-grid-container ds-page-grid">{Array.from({ length: columns }, (_, index) => <i key={index} />)}</span></div>
}
