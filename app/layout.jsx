import React from 'react'
import '../src/design-system/styles.css'
import '../src/app.css'
import '../src/motion.css'
import '../src/design-system/gallery.css'
import { assetPath } from '../src/assetPath.js'

export const metadata = {
  title: 'Skip — MO/GO',
  description: 'Wearable tech for more freedom in every step you make.',
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
