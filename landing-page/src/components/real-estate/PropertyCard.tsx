'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Property } from '@/data/properties'
import { PriceDisplay } from './PriceDisplay'
import { useCompareStore } from '@/stores/compare.store'
import { PropertyQuickViewModal } from './PropertyQuickViewModal'
import { BulkBuyModal } from './BulkBuyModal'
import { BuyPropertyModal } from './BuyPropertyModal'
import { Bed, Bath, Maximize2, MapPin, ArrowRight, Eye, Scale, Building2, ShoppingCart, Key, FileText } from 'lucide-react'

const FRONTEND_TYPE_TO_API: Record<string, string> = {
  Villa: 'VILLA',
  Apartment: 'APARTMENT',
  Commercial: 'COMMERCIAL',
  Estate: 'LAND',
  Penthouse: 'APARTMENT',
  Waterfront: 'VILLA',
}

interface PropertyCardProps {
  property: Property
  variant?: 'A' | 'B' | 'C' | 'D'
  className?: string
}

function PropertyPhoto({
  src,
  alt,
  sizes,
  priority,
}: {
  src?: string
  alt: string
  sizes: string
  priority?: boolean
}) {
  if (!src) {
    return <div className="absolute inset-0 bg-gray-100" aria-hidden />
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
    />
  )
}

function renderSpecsSummary(specs: Property['specs']) {
  const parts: string[] = []
  if (specs.bedrooms > 0) parts.push(`${specs.bedrooms} Beds`)
  if (specs.bathrooms > 0) parts.push(`${specs.bathrooms} Baths`)
  if (specs.areaSqFt > 0) parts.push(`${specs.areaSqFt.toLocaleString('en-IN')} sq ft`)

  if (parts.length === 0) return 'Residential Plot'
  return parts.join(' · ')
}

export function PropertyCard({
  property,
  variant = 'B',
  className = '',
}: PropertyCardProps) {
  const [isQuickViewOpen, setIsQuickViewOpen] = React.useState(false)
  const [isBulkBuyOpen, setIsBulkBuyOpen] = React.useState(false)
  const [isBuyOpen, setIsBuyOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const bulkBuyContext = {
    propertyId: property.id,
    propertyTitle: property.title,
    city: property.location.city,
    propertyType: FRONTEND_TYPE_TO_API[property.propertyType] || '',
  }

  // Map property listingType to modal intent
  const inquiryIntent =
    property.listingType === 'Rent' ? 'RENT' :
    property.listingType === 'Lease' ? 'LEASE' : 'BUY'

  // Dynamic button config based on listing type
  const intentLabel =
    property.listingType === 'Rent' ? 'Enquire Rent' :
    property.listingType === 'Lease' ? 'Enquire Lease' : 'Buy Now'
  const IntentIcon =
    property.listingType === 'Rent' ? Key :
    property.listingType === 'Lease' ? FileText : ShoppingCart
  const intentBtnClass =
    property.listingType === 'Rent' ? 'bg-sky-600 hover:bg-sky-700 border-sky-600' :
    property.listingType === 'Lease' ? 'bg-violet-600 hover:bg-violet-700 border-violet-600' :
    'bg-emerald-600 hover:bg-emerald-700 border-emerald-600'

  const handleBulkBuyClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsBulkBuyOpen(true)
  }

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsBuyOpen(true)
  }

  const isComparingStore = useCompareStore((state) => state.isComparing(property.id))
  const toggleCompare = useCompareStore((state) => state.toggleCompare)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isComparing = mounted ? isComparingStore : false

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleCompare(property.id)
  }

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsQuickViewOpen(true)
  }

  // Variant A: Large Editorial Feature Card
  if (variant === 'A') {
    return (
      <>
        <div className={`group relative bg-white border border-brand-green/15 rounded-md overflow-hidden hover:border-brand-green/30 transition-all duration-300 shadow-md ${className}`}>
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden">
            <PropertyPhoto
              src={property.images.hero}
              alt={property.title}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={property.isFeatured}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-85" />

            {/* Badges & Actions */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <span className="px-3 py-1 bg-white/95 text-brand-green border border-brand-green/20 text-[10px] uppercase tracking-[0.18em] font-bold rounded-md shadow-sm">
                {property.listingType === 'Rent' ? 'Private Lease' : 'Featured Collection'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickViewClick}
                  className="px-3 py-2 sm:py-1 bg-white/95 text-brand-charcoal text-[10px] font-semibold uppercase tracking-wider rounded-md border border-brand-green/20 flex items-center gap-1.5 shadow-sm hover:bg-brand-green hover:text-white transition-all cursor-pointer min-h-[44px] sm:min-h-0"
                  title="Quick View"
                >
                  <Eye className="w-3.5 h-3.5 text-brand-green group-hover:text-white" />
                  <span className="hidden lg:inline">Quick View</span>
                </button>
                <button
                  type="button"
                  onClick={handleBuyClick}
                  className={`px-3 py-2 sm:py-1 text-white text-[10px] font-bold uppercase tracking-wider rounded-md border flex items-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[44px] sm:min-h-0 ${intentBtnClass}`}
                >
                  <IntentIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{intentLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={handleBulkBuyClick}
                  className="px-3 py-2 sm:py-1 bg-brand-green text-white text-[10px] font-semibold uppercase tracking-wider rounded-md border border-brand-green flex items-center gap-1.5 shadow-sm hover:bg-brand-dark transition-all cursor-pointer min-h-[44px] sm:min-h-0"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bulk Buy</span>
                </button>
              </div>
            </div>

            {/* Overlay Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 space-y-3 z-10 text-white">
              <div className="flex items-center gap-2 text-xs text-white/80">
                <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                <span>{property.location.area}, {property.location.city}</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl text-white font-semibold group-hover:text-brand-soft transition-colors">
                {property.title}
              </h3>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/20">
                <PriceDisplay formattedPrice={property.formattedPrice} size="md" textColor="text-white" subTextColor="text-white/80" />

                <div className="flex items-center space-x-3 text-xs text-white/90 font-mono">
                  <span>{renderSpecsSummary(property.specs)}</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            href={`/properties/${property.slug}`}
            className="absolute inset-0 z-0"
            aria-label={`View details for ${property.title}`}
          />
        </div>

        <PropertyQuickViewModal
          property={isQuickViewOpen ? property : null}
          onClose={() => setIsQuickViewOpen(false)}
        />
        <BulkBuyModal
          isOpen={isBulkBuyOpen}
          onClose={() => setIsBulkBuyOpen(false)}
          context={bulkBuyContext}
        />
        <BuyPropertyModal
          isOpen={isBuyOpen}
          onClose={() => setIsBuyOpen(false)}
          propertyId={property.id}
          propertyTitle={property.title}
          propertyCity={property.location?.city}
          propertyPrice={property.formattedPrice}
          defaultIntent={inquiryIntent as any}
        />
      </>
    )
  }

  // Variant C: Horizontal Search Card
  if (variant === 'C') {
    return (
      <>
        <div className={`group relative bg-white border border-brand-green/15 rounded-md flex flex-col md:flex-row overflow-hidden hover:border-brand-green/30 transition-all duration-300 shadow-sm ${className}`}>
          <div className="relative md:w-2/5 aspect-[16/10] md:aspect-auto overflow-hidden">
            <PropertyPhoto
              src={property.images.hero}
              alt={property.title}
              sizes="(max-width: 768px) 100vw, 40vw"
            />
            <div className="absolute top-3 left-3 z-10">
              <span className="px-2.5 py-1 bg-white/95 text-brand-green text-[9px] uppercase tracking-widest font-bold border border-brand-green/20 rounded-md">
                {property.propertyType}
              </span>
            </div>
          </div>

          <div className="p-6 md:w-3/5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-brand-charcoal/70">
                  <MapPin className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>{property.location.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCompareClick}
                    className={`px-2.5 py-2 sm:py-1 text-[10px] font-mono border rounded-md transition-colors cursor-pointer min-h-[44px] sm:min-h-0 ${
                      isComparing ? 'bg-brand-green text-white border-brand-green font-bold' : 'bg-brand-soft text-brand-charcoal border-brand-green/20 hover:border-brand-green'
                    }`}
                  >
                    {isComparing ? 'Comparing ✓' : '+ Compare'}
                  </button>
                </div>
              </div>

              <Link href={`/properties/${property.slug}`}>
                <h3 className="font-serif text-2xl sm:text-3xl text-brand-charcoal font-semibold group-hover:text-brand-green transition-colors">
                  {property.title}
                </h3>
              </Link>
              <p className="text-xs text-brand-charcoal/70 font-light line-clamp-2">{property.tagline}</p>
            </div>

            <div className="pt-4 border-t border-brand-green/10 flex flex-wrap items-center justify-between gap-4">
              <PriceDisplay
                formattedPrice={property.formattedPrice}
                formattedPricePerSqFt={property.formattedPricePerSqFt}
                size="sm"
                textColor="text-brand-green font-bold"
                subTextColor="text-brand-charcoal/60"
              />

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleBuyClick}
                  className={`px-3 py-2 sm:py-1.5 text-white border text-xs font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer flex items-center gap-1 min-h-[44px] sm:min-h-0 ${intentBtnClass}`}
                >
                  <IntentIcon className="w-3.5 h-3.5" />
                  {intentLabel}
                </button>
                <button
                  type="button"
                  onClick={handleBulkBuyClick}
                  className="px-3 py-2 sm:py-1.5 bg-white hover:bg-brand-green hover:text-white border border-brand-green/20 text-brand-green text-xs font-semibold uppercase tracking-wider rounded-md transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
                >
                  Bulk Buy
                </button>
                <button
                  type="button"
                  onClick={handleQuickViewClick}
                  className="px-3 py-2 sm:py-1.5 bg-brand-soft hover:bg-brand-green hover:text-white border border-brand-green/20 text-brand-green text-xs font-semibold uppercase tracking-wider rounded-md transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
                >
                  Quick View
                </button>
                <Link
                  href={`/properties/${property.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-brand-green text-white font-semibold text-xs uppercase tracking-wider rounded-md hover:bg-brand-dark transition-colors min-h-[44px] sm:min-h-0"
                >
                  <span>View Property</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <PropertyQuickViewModal
          property={isQuickViewOpen ? property : null}
          onClose={() => setIsQuickViewOpen(false)}
        />
        <BulkBuyModal
          isOpen={isBulkBuyOpen}
          onClose={() => setIsBulkBuyOpen(false)}
          context={bulkBuyContext}
        />
        <BuyPropertyModal
          isOpen={isBuyOpen}
          onClose={() => setIsBuyOpen(false)}
          propertyId={property.id}
          propertyTitle={property.title}
          propertyCity={property.location?.city}
          propertyPrice={property.formattedPrice}
          defaultIntent={inquiryIntent as any}
        />
      </>
    )
  }

  // Variant B: Standard Property Card (Default)
  return (
    <>
      <div className={`group relative bg-white border border-brand-green/15 rounded-md flex flex-col overflow-hidden hover:border-brand-green/30 transition-all duration-300 shadow-sm ${className}`}>
        {/* Image Container */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <PropertyPhoto
            src={property.images.hero}
            alt={property.title}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Badges & Actions */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <span className="px-2.5 py-1 bg-white/95 text-brand-green text-[9px] uppercase tracking-widest font-bold border border-brand-green/20 rounded-md shadow-sm">
              {property.propertyType}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleQuickViewClick}
                className="px-2.5 py-2 sm:py-1 bg-white/95 hover:bg-brand-green hover:text-white text-brand-charcoal text-[10px] font-semibold uppercase tracking-wider rounded-md border border-brand-green/20 flex items-center gap-1 shadow-sm transition-all cursor-pointer min-h-[44px] sm:min-h-0"
                title="Quick View"
              >
                <Eye className="w-3 h-3 text-brand-green" />
                <span className="hidden sm:inline">Quick View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            {/* Price is Primary */}
            <div className="flex items-baseline justify-between gap-2 border-b border-brand-green/10 pb-3">
              <span className="text-xl sm:text-2xl font-bold text-brand-green tracking-tight font-sans truncate">
                {property.formattedPrice}
              </span>
              <button
                type="button"
                onClick={handleCompareClick}
                className={`text-[10px] font-mono px-2 py-2 sm:py-0.5 border rounded-md transition-colors cursor-pointer shrink-0 min-h-[44px] sm:min-h-0 ${
                  isComparing ? 'bg-brand-green text-white border-brand-green font-bold' : 'bg-brand-soft text-brand-charcoal border-brand-green/20 hover:border-brand-green'
                }`}
              >
                {isComparing ? 'Comparing ✓' : '+ Compare'}
              </button>
            </div>

            <Link href={`/properties/${property.slug}`}>
              <h3 className="font-serif text-2xl text-brand-charcoal font-semibold group-hover:text-brand-green transition-colors line-clamp-1">
                {property.title}
              </h3>
            </Link>

            <div className="flex items-center gap-1 text-[11px] text-brand-charcoal/70 font-medium">
              <MapPin className="w-3 h-3 text-brand-green shrink-0" />
              <span className="truncate">{property.location.area}, {property.location.city}</span>
            </div>
          </div>

          {/* Specs & Actions */}
          <div className="pt-3 border-t border-brand-green/10 space-y-2.5">
            <div className="text-[11px] font-mono text-brand-charcoal/80 font-medium truncate">
              {renderSpecsSummary(property.specs)}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-brand-green/5 text-xs">
              <button
                type="button"
                onClick={handleBuyClick}
                className={`inline-flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-colors px-3 py-2.5 sm:py-1 rounded-lg min-h-[44px] sm:min-h-0 ${
                  property.listingType === 'Rent'
                    ? 'text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100'
                    : property.listingType === 'Lease'
                    ? 'text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100'
                    : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <IntentIcon className="w-3 h-3" />
                <span>{intentLabel}</span>
              </button>
              <button
                type="button"
                onClick={handleBulkBuyClick}
                className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-brand-green hover:text-brand-dark transition-colors px-2 py-2.5 sm:py-0 rounded-lg min-h-[44px] sm:min-h-0"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Bulk Buy</span>
              </button>
              <Link
                href={`/properties/${property.slug}`}
                className="inline-flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand-green hover:text-brand-dark transition-colors px-2 py-2.5 sm:py-0 rounded-lg min-h-[44px] sm:min-h-0"
              >
                <span>View Property</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PropertyQuickViewModal
        property={isQuickViewOpen ? property : null}
        onClose={() => setIsQuickViewOpen(false)}
      />
      <BulkBuyModal
        isOpen={isBulkBuyOpen}
        onClose={() => setIsBulkBuyOpen(false)}
        context={bulkBuyContext}
      />
      <BuyPropertyModal
        isOpen={isBuyOpen}
        onClose={() => setIsBuyOpen(false)}
        propertyId={property.id}
        propertyTitle={property.title}
        propertyCity={property.location?.city}
        propertyPrice={property.formattedPrice}
        defaultIntent={inquiryIntent as any}
      />
    </>
  )
}
