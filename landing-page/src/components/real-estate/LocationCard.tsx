import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Location, LOCATIONS } from '@/data/locations'
import { ArrowUpRight, TrendingUp } from 'lucide-react'

interface LocationCardProps {
  location: Location
  className?: string
}

export function LocationCard({ location, className = '' }: LocationCardProps) {
  // Only statically generated location slugs have a detail page; DB-derived hubs link to the filtered property directory
  const hasDetailPage = LOCATIONS.some((l) => l.slug === location.slug)
  const href = hasDetailPage
    ? `/locations/${location.slug}`
    : `/properties?location=${encodeURIComponent(location.name || location.slug)}`
  return (
    <Link
      href={href}
      className={`group relative bg-bg-surface border border-white/15 overflow-hidden block hover:border-white/35 transition-all duration-500 shadow-lg ${className}`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={location.cardImage}
          alt={location.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

        {/* Top Growth & Count Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <span className="px-3 py-1 bg-black/80 backdrop-blur-md border border-white/30 text-[10px] uppercase tracking-[0.2em] font-bold text-gold-300 flex items-center gap-1.5 shadow-md">
            <TrendingUp className="w-3 h-3 text-gold-300" />
            <span>YoY {location.yoyGrowth}</span>
          </span>
          <span className="px-3 py-1 bg-gold-300 text-black text-[10px] uppercase tracking-[0.2em] font-extrabold shadow-md">
            {location.activeListingsCount} Estates
          </span>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2 z-10">
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-gold-300 block">
            {location.state}
          </span>
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl text-white font-semibold group-hover:text-gold-200 transition-colors">
              {location.name}
            </h3>
            <div className="w-8 h-8 rounded-full bg-black/80 border border-white/30 flex items-center justify-center text-white group-hover:bg-gold-300 group-hover:text-black transition-colors shadow-md">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-white/80 line-clamp-1 font-light">
            {location.tagline}
          </p>
        </div>
      </div>
    </Link>
  )
}
