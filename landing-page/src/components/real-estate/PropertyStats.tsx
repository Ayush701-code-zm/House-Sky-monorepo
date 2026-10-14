import * as React from 'react'
import { PropertySpec } from '@/data/properties'
import { Bed, Bath, Maximize2, Car, Calendar, Layers } from 'lucide-react'

interface PropertyStatsProps {
  specs: PropertySpec
  className?: string
}

export function PropertyStats({ specs, className = '' }: PropertyStatsProps) {
  const statItems = [
    { label: 'Bedrooms', value: `${specs.bedrooms} Suites`, icon: Bed },
    { label: 'Bathrooms', value: `${specs.bathrooms} Baths`, icon: Bath },
    { label: 'Carpet Area', value: `${specs.areaSqFt.toLocaleString()} sq ft`, icon: Maximize2 },
    { label: 'Parking Bays', value: `${specs.parkingSpaces} Reserved`, icon: Car },
    { label: 'Year Built', value: specs.yearBuilt.toString(), icon: Calendar },
    { label: 'Elevation', value: specs.floorNumber ? `Floor ${specs.floorNumber}` : 'Private Ground Estate', icon: Layers },
  ]

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 p-6 bg-bg-surface border border-white/10 ${className}`}>
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label} className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-gold-300">
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                {item.label}
              </span>
            </div>
            <span className="block font-sans text-sm sm:text-base font-semibold text-white tracking-tight">
              {item.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}
