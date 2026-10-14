import * as React from 'react'
import { Amenity } from '@/data/properties'
import {
  Waves,
  ShieldCheck,
  Car,
  Zap,
  Dumbbell,
  Wine,
  Sparkles,
  Sun,
  Trees,
  Utensils,
  Coffee,
  Target,
  Tv,
  Flame,
  CheckCircle2,
} from 'lucide-react'

interface PropertyAmenitiesProps {
  amenities: Amenity[]
  className?: string
}

export function PropertyAmenities({ amenities, className = '' }: PropertyAmenitiesProps) {
  // Map icon names to Lucide icons dynamically
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Waves': return Waves
      case 'ShieldCheck': return ShieldCheck
      case 'Car': return Car
      case 'Zap': return Zap
      case 'Dumbbell': return Dumbbell
      case 'Wine': return Wine
      case 'Sparkles': return Sparkles
      case 'Sun': return Sun
      case 'Trees': return Trees
      case 'Utensils': return Utensils
      case 'Coffee': return Coffee
      case 'Target': return Target
      case 'Tv': return Tv
      case 'Flame': return Flame
      default: return CheckCircle2
    }
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {amenities.map((amenity) => {
        const IconComponent = getIcon(amenity.icon)
        return (
          <div
            key={amenity.name}
            className="flex items-center gap-3 p-4 bg-bg-surface/80 border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-none text-gold-300 shrink-0">
              <IconComponent className="w-5 h-5" />
            </div>
            <span className="text-xs text-white font-medium tracking-wide">
              {amenity.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
