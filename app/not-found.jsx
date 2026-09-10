import React from 'react'
import content from '../src/content.json' with { type: 'json' }
import { Button, Type } from '../src/design-system/index.jsx'
import { assetPath } from '../src/assetPath.js'

export default function NotFound() {
  return (
    <main className="ds-not-found">
      <Type as="h1" role="h1">{content.notFound.title}</Type>
      <Button href={assetPath('/')}>{content.notFound.returnHomeButton}</Button>
    </main>
  )
}
