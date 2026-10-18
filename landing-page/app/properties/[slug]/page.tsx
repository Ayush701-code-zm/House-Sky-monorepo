'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { InquiryForm } from '@/components/real-estate/InquiryForm'
import { BulkBuyModal } from '@/components/real-estate/BulkBuyModal'
import { getApiBaseUrl } from '@/utils/api'
import { FALLBACK_IMAGE } from '@/utils/siteConfig'
import { Building2, CheckCircle2, ChevronRight, MapPin } from 'lucide-react'
import { PageSection } from '@/components/layout/PageSection'
import dynamic from 'next/dynamic'
import { hasValidCoords } from '@/components/maps/LocationMap'

const LocationMap = dynamic(
  () => import('@/components/maps/LocationMap').then((m) => m.LocationMap),
  { ssr: false, loading: () => <div className="w-full h-64 bg-brand-soft animate-pulse rounded-2xl" /> }
)

export default function PropertyDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [payload, setPayload] = React.useState<any | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeImage, setActiveImage] = React.useState('')
  const [isBulkBuyOpen, setIsBulkBuyOpen] = React.useState(false)

  React.useEffect(() => {
    if (!slug) return
    const load = async () => {
      try {
        const baseUrl = getApiBaseUrl()
        const res = await fetch(`${baseUrl}/public/properties/${encodeURIComponent(slug)}`).catch(() => null)
        if (res && res.ok) {
          const data = await res.json()
          setPayload(data)
          const first = data?.property?.heroImage || data?.property?.gallery?.[0]?.url || FALLBACK_IMAGE
          setActiveImage(first)
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [slug])

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-xs font-mono text-brand-charcoal/60">Loading property…</div>
  }

  const property = payload?.property
  if (!property) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-serif text-4xl font-semibold">Property not found</h1>
        <Link href="/properties" className="text-brand-green text-sm font-bold">Back to properties</Link>
      </div>
    )
  }

  const gallery = [
    property.heroImage,
    ...(property.gallery || []).map((item: any) => item.url)
  ].filter(Boolean)

  return (
    <PageSection tone="white" innerClassName="space-y-10">
      <nav className="flex items-center space-x-2 text-xs text-brand-charcoal/60">
        <Link href="/" className="hover:text-brand-green">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/properties" className="hover:text-brand-green">Properties</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-brand-charcoal font-semibold truncate">{property.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-brand-charcoal">
            <Image src={activeImage || FALLBACK_IMAGE} alt={property.title} fill className="object-cover" unoptimized />
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {gallery.slice(0, 10).map((url: string) => (
                <button key={url} type="button" onClick={() => setActiveImage(url)} className={`relative aspect-square rounded-xl overflow-hidden border ${activeImage === url ? 'border-brand-green' : 'border-transparent'}`}>
                  <Image src={url} alt="" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-green">{property.propertyType?.replace('_', ' ')}</p>
            <h1 className="font-serif text-4xl sm:text-5xl text-brand-charcoal font-semibold mt-2">{property.title}</h1>
            <p className="mt-2 text-sm text-brand-charcoal/70 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-green" />
              {[property.address, property.location, property.city].filter(Boolean).join(', ')}
            </p>
          </div>
          <div className="bg-brand-soft rounded-2xl p-4">
            <p className="text-2xl font-serif font-bold text-brand-green">
              {property.priceRange || (property.price ? `₹${Number(property.price).toLocaleString('en-IN')}` : 'Price on request')}
            </p>
            {property.dimensions && <p className="text-xs text-brand-charcoal/60 mt-1">Dimensions {property.dimensions}</p>}
          </div>
          <p className="text-sm text-brand-charcoal/70 leading-relaxed">{property.description}</p>
          {(property.highlights || []).length > 0 && (
            <div className="space-y-2">
              {property.highlights.map((item: string) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-brand-green mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
          {hasValidCoords(property.latitude, property.longitude) && (
            <div className="rounded-2xl overflow-hidden border border-brand-green/15 h-64">
              <LocationMap
                latitude={property.latitude}
                longitude={property.longitude}
                title={property.title}
              />
            </div>
          )}
          {!hasValidCoords(property.latitude, property.longitude) && property.mapEmbedUrl && (
            <div className="rounded-2xl overflow-hidden border border-brand-green/15 h-64">
              <iframe
                title="Property location"
                src={property.mapEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsBulkBuyOpen(true)}
            className="w-full py-3 rounded-xl border border-brand-green text-brand-green text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-green hover:text-white transition-colors"
          >
            <Building2 className="w-4 h-4" />
            Bulk Buy — request a callback
          </button>
          <InquiryForm propertyTitle={property.title} />
        </div>
      </div>

      <BulkBuyModal
        isOpen={isBulkBuyOpen}
        onClose={() => setIsBulkBuyOpen(false)}
        context={{
          propertyId: property._id,
          propertyTitle: property.title,
          city: property.city || '',
          propertyType: property.propertyType || '',
        }}
      />
    </PageSection>
  )
}
