'use client'

import * as React from 'react'
import { Bookmark } from 'lucide-react'
import { useSavedStore } from '@/stores/saved.store'

interface FavoriteButtonProps {
  propertyId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function FavoriteButton({
  propertyId,
  className = '',
  size = 'md',
}: FavoriteButtonProps) {
  const [mounted, setMounted] = React.useState(false)
  const isSavedStore = useSavedStore((state) => state.isSaved(propertyId))
  const toggleProperty = useSavedStore((state) => state.toggleProperty)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Deterministic initial server and client render
  const isSaved = mounted ? isSavedStore : false

  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-9 h-9 p-2',
    lg: 'w-11 h-11 p-2.5',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
    lg: 'w-5.5 h-5.5',
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleProperty(propertyId)
  }

  const ariaLabel = isSaved ? 'Remove from saved properties' : 'Save property'

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`rounded-md flex items-center justify-center transition-all duration-200 border shadow-md cursor-pointer ${
        isSaved
          ? 'bg-brand-green border-brand-green text-white shadow-brand-green/20'
          : 'bg-white/95 border-brand-green/20 text-brand-green hover:bg-brand-green hover:text-white hover:border-brand-green'
      } ${sizeClasses[size]} ${className}`}
    >
      <Bookmark
        className={`${iconSizes[size]} transition-transform duration-200 ${
          isSaved ? 'fill-white text-white' : 'fill-brand-green/10 text-current'
        }`}
      />
    </button>
  )
}
