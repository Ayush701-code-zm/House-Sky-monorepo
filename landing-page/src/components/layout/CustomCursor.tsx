'use client'

import * as React from 'react'

export function CustomCursor() {
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'auto'
    }
  }, [])

  return null
}

export default CustomCursor
