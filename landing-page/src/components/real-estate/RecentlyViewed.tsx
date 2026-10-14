'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PROPERTIES, Property } from '@/data/properties'
import { PriceDisplay } from './PriceDisplay'
import { Clock, MapPin, ArrowUpRight } from 'lucide-react'

interface RecentlyViewedProps {
  currentPropertyId?: string
  className?: string
}

export function RecentlyViewed({ currentPropertyId, className = '' }: RecentlyViewedProps) {
  const [recentlyViewedIds, setRecentlyViewedIds] = React.useState<string[]>([])

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('auraveloce_recently_viewed')
      let ids: string[] = stored ? JSON.parse(stored) : []

      if (currentPropertyId) {
        ids = [currentPropertyId, ...ids.filter((id) => id !== currentPropertyId)].slice(0, 6)
        localStorage.setItem('auraveloce_recently_viewed', JSON.stringify(ids))
      }

      setRecentlyViewedIds(ids.filter((id) => id !== currentPropertyId))
    } catch (e) {
      // localStorage fallback
    }
  }, [currentPropertyId])

  const viewedProperties = React.useMemo(() => {
    return PROPERTIES.filter((p) => recentlyViewedIds.includes(p.id))
  }, [recentlyViewedIds])

  if (viewedProperties.length === 0) return null

  return (
    <div className={`space-y-6 pt-10 border-t border-brand-green/15 ${className}`}>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-green" />
        <h3 className="font-serif text-2xl text-brand-charcoal font-semibold">Recently Inspected Residences</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {viewedProperties.map((prop) => (
          <Link
            key={prop.id}
            href={`/properties/${prop.slug}`}
            className="group bg-white border border-brand-green/15 overflow-hidden block hover:border-brand-green/40 transition-all rounded-2xl"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <Image
                src={prop.images.hero}
                alt={prop.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-1 text-[10px] text-brand-charcoal/50 uppercase">
                <MapPin className="w-3 h-3 text-brand-green" />
                <span>{prop.location.area}, {prop.location.city}</span>
              </div>
              <h4 className="font-serif text-base text-brand-charcoal font-semibold group-hover:text-brand-green line-clamp-1">{prop.title}</h4>
              <span className="text-sm font-bold font-sans text-brand-charcoal block">{prop.formattedPrice}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
