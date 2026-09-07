import React from 'react'
import { Button, Type } from '../src/design-system/index.jsx'
import { assetPath } from '../src/assetPath.js'

export default function NotFound() {
  return (
    <main className="ds-not-found">
      <Type as="h1" role="h1">Page not found</Type>
      <Button href={assetPath('/')}>Return home</Button>
    </main>
  )
}
