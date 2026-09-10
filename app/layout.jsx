import React from 'react'
import content from '../src/content.json' with { type: 'json' }
import '../src/design-system/styles.css'
import '../src/app.css'
import '../src/motion.css'
import '../src/design-system/gallery.css'
import { assetPath } from '../src/assetPath.js'

export const metadata = {
  title: content.site.metadataTitle,
  description: content.site.metadataDescription,
  icons: {
    icon: assetPath('/assets/skip/icons/Logo.svg'),
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
