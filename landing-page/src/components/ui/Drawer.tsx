'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'
import { X } from 'lucide-react'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  position?: 'right' | 'left'
  className?: string
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  className,
}: DrawerProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!mounted || !isOpen) return null

  const positionStyles = {
    right: 'right-0 top-0 bottom-0 h-full w-full sm:max-w-md border-l border-gold-300/20',
    left: 'left-0 top-0 bottom-0 h-full w-full sm:max-w-md border-r border-gold-300/20',
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-bg-overlay backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed bg-bg-secondary p-4 sm:p-6 md:p-8 flex flex-col z-10 shadow-2xl rounded-none transition-transform duration-300 ease-out',
          positionStyles[position],
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-white-500/20 pb-4 mb-6">
          {title && (
            <h2 className="font-cormorant text-heading-lg font-light text-white-100 tracking-wide">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="text-white-300 hover:text-gold-300 transition-colors p-1 ml-auto"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>,
    document.body
  )
}
