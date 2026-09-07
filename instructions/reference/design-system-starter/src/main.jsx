import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Gallery } from './design-system/Gallery.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
)

