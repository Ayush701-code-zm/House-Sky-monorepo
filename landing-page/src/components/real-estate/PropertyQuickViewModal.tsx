'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Property } from '@/data/properties'
import { PriceDisplay } from './PriceDisplay'
import { BuyPropertyModal } from './BuyPropertyModal'
import {
  X,
  MapPin,
  ArrowUpRight,
  Bed,
  Bath,
  Maximize2,
  ShieldCheck,
  ShoppingCart,
  Key,
  FileText
} from 'lucide-react'

interface PropertyQuickViewModalProps {
  property: Property | null
  onClose: () => void
}

export function PropertyQuickViewModal({ property, onClose }: PropertyQuickViewModalProps) {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null)
  const [isBuyModalOpen, setIsBuyModalOpen] = React.useState(false)

  React.useEffect(() => {
    if (property) {
      setSelectedImage(property.images.hero)
      setIsBuyModalOpen(false)
    }
  }, [property])

  if (!property) return null

  const activeImage = selectedImage || property.images.hero || ''
  const allImages = [property.images.hero, ...(property.images.gallery || [])].filter(
    (img, idx, self): img is string => Boolean(img) && self.indexOf(img) === idx
  )

  const inquiryIntent =
    property.listingType === 'Rent' ? 'RENT' :
    property.listingType === 'Lease' ? 'LEASE' : 'BUY'

  const intentLabel =
    property.listingType === 'Rent' ? 'Enquire Rent' :
    property.listingType === 'Lease' ? 'Enquire Lease' : 'Buy Now'

  const IntentIcon =
    property.listingType === 'Rent' ? Key :
    property.listingType === 'Lease' ? FileText : ShoppingCart

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full max-h-[92vh] overflow-y-auto relative p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 text-slate-600 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-full flex items-center justify-center z-20 transition-all cursor-pointer shadow-sm border border-slate-200"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left Photo & Thumbnails */}
            <div className="md:col-span-6 space-y-3">
              <div className="relative aspect-[16/11] w-full rounded-2xl border border-slate-200 overflow-hidden bg-gray-100 shadow-inner">
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={property.title}
                    fill
                    className="object-cover transition-all duration-300"
                  />
                ) : null}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-800 text-white text-[10px] uppercase tracking-wider font-extrabold rounded-full shadow-md">
                    {property.propertyType}
                  </span>
                  {(property.isFeatured || (property as any).isVerified) && (
                    <span className="px-2.5 py-1 bg-slate-900/90 backdrop-blur-sm text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1 border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified RERA
                    </span>
                  )}
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.slice(0, 4).map((img, idx) => {
                    const isSelected = activeImage === img
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImage(img)}
                        className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/20 scale-102' : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image src={img} alt={`Preview ${idx + 1}`} fill className="object-cover" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right Details & Action buttons */}
            <div className="md:col-span-6 space-y-5">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{property.location.area}, {property.location.city}</span>
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-2xl sm:text-3xl text-slate-900 font-bold leading-tight">
                  {property.title}
                </h3>
                {property.tagline && (
                  <p className="text-xs text-slate-500 font-medium">{property.tagline}</p>
                )}
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <PriceDisplay
                  formattedPrice={property.formattedPrice}
                  formattedPricePerSqFt={property.formattedPricePerSqFt}
                  size="lg"
                  textColor="text-emerald-950 font-extrabold"
                  subTextColor="text-emerald-700 font-medium"
                />
              </div>

              {/* Specs Summary Grid */}
              <div className="grid grid-cols-3 gap-2 py-3 px-2 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-extrabold">
                    <Bed className="w-3.5 h-3.5 text-emerald-600" /> Beds
                  </div>
                  <span className="text-sm font-bold text-slate-900 mt-0.5">
                    {property.specs.bedrooms > 0 ? property.specs.bedrooms : 'Plot'}
                  </span>
                </div>
                <div className="flex flex-col items-center border-x border-slate-200">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-extrabold">
                    <Bath className="w-3.5 h-3.5 text-emerald-600" /> Baths
                  </div>
                  <span className="text-sm font-bold text-slate-900 mt-0.5">
                    {property.specs.bathrooms > 0 ? property.specs.bathrooms : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-extrabold">
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-600" /> Sq Ft
                  </div>
                  <span className="text-sm font-bold text-slate-900 mt-0.5">
                    {property.specs.areaSqFt > 0 ? property.specs.areaSqFt.toLocaleString('en-IN') : 'Contact'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-3">
                {property.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBuyModalOpen(true)}
                  className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <IntentIcon className="w-4 h-4" />
                  <span>{intentLabel}</span>
                </button>

                <Link
                  href={`/properties/${property.slug}`}
                  onClick={onClose}
                  className="w-full sm:flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-1.5 text-center shadow-md cursor-pointer"
                >
                  <span>Full Details</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BuyPropertyModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        propertyId={property.id}
        propertyTitle={property.title}
        propertyCity={property.location?.city}
        propertyPrice={property.formattedPrice}
        defaultIntent={inquiryIntent as any}
      />
    </>
  )
}
