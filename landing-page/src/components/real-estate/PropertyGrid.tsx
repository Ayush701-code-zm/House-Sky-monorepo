import * as React from 'react'
import { Property } from '@/data/properties'
import { PropertyCard } from './PropertyCard'

interface PropertyGridProps {
  properties: Property[]
  columns?: 1 | 2 | 3 | 4
  variant?: 'A' | 'B' | 'C' | 'D'
  className?: string
}

export function PropertyGrid({
  properties,
  columns = 3,
  variant = 'B',
  className = '',
}: PropertyGridProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white border border-brand-green/15 rounded-2xl my-8">
        <h3 className="font-serif text-2xl text-brand-charcoal font-semibold mb-2">No Properties Found</h3>
        <p className="text-base text-brand-charcoal/70">
          Try broadening your search criteria or resetting filters to explore available luxury residences.
        </p>
      </div>
    )
  }

  return (
    <div className={`grid gap-6 sm:gap-8 ${columnClasses[columns]} ${className}`}>
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} variant={variant} />
      ))}
    </div>
  )
}
