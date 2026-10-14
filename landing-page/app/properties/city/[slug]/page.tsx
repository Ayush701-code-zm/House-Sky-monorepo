'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Property } from '@/data/properties'
import { PropertyCard } from '@/components/real-estate/PropertyCard'
import { PageSection } from '@/components/layout/PageSection'
import { loadCatalogProperties } from '@/utils/mapListing'
import {
  DEFAULT_CITY_NAMES,
  PublicCity,
  cityToSlug,
  getCityImage,
  getCityPageCopy,
  propertyMatchesCitySlug,
  useConfiguredCities
} from '@/utils/cities'
import { ArrowLeft, ArrowRight, MapPin, ShieldCheck } from 'lucide-react'

export default function CityPropertiesPage() {
  const params = useParams()
  const slug = String(params?.slug || '').toLowerCase()
  const { cities, loaded } = useConfiguredCities()
  const [listings, setListings] = React.useState<Property[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    setIsLoading(true)
    loadCatalogProperties({ useFallbackImage: false }).then((mapped) => {
      if (!active) return
      setListings(mapped.filter((property) => propertyMatchesCitySlug(property.location?.city || '', slug)))
      setIsLoading(false)
    })
    return () => {
      active = false
    }
  }, [slug])

  const matched = React.useMemo(() => {
    const configured = cities.find((city) => cityToSlug(city.name) === slug)
    if (configured) return configured
    const fromListing = listings.find((property) => property.location?.city)?.location.city
    if (fromListing) return { name: fromListing } as PublicCity
    const fallbackName = DEFAULT_CITY_NAMES.find((name) => cityToSlug(name) === slug)
    if (fallbackName) return { name: fallbackName } as PublicCity
    return null
  }, [cities, listings, slug])

  if (!matched) {
    if (!loaded || isLoading) {
      return <section className="min-h-[50vh] bg-gray-100" aria-hidden />
    }
    return (
      <PageSection tone="white">
        <div className="max-w-xl space-y-4">
          <h1 className="font-serif text-4xl font-semibold text-brand-charcoal">City not found</h1>
          <Link href="/properties" className="inline-flex items-center gap-2 text-sm font-bold text-brand-green">
            <ArrowLeft className="w-4 h-4" /> Back to properties
          </Link>
        </div>
      </PageSection>
    )
  }

  const cityName = matched.name
  const imageUrl = matched.imageUrl || getCityImage(cityName)
  const copy = getCityPageCopy(cityName)
  const listingCount = listings.length
  const listingLabel = listingCount === 1 ? 'verified listing' : 'verified listings'

  return (
    <div>
      <section className="relative min-h-[52vh] sm:min-h-[58vh] h-[360px] sm:h-[440px] max-h-[560px] flex items-end overflow-hidden bg-brand-charcoal">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`${cityName} real estate`}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        ) : null}
        <div
          className={`absolute inset-0 ${
            imageUrl
              ? 'bg-gradient-to-t from-black/85 via-black/45 to-black/20'
              : 'bg-brand-charcoal'
          }`}
        />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full pb-10 sm:pb-14 pt-24 space-y-4">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/75 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All properties
          </Link>

          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#C9A96E]">
            {copy.eyebrow}
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-white max-w-3xl leading-[1.08]">
            {copy.headline}
          </h1>

          <p className="text-base sm:text-lg text-white/85 font-normal max-w-2xl leading-relaxed">
            {copy.tagline}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {!isLoading && listingCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 border border-white/20 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C9A96E]" />
                {listingCount} {listingLabel}
              </span>
            ) : null}
            <Link
              href="/list-your-property"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/80 hover:text-white transition-colors"
            >
              List in {cityName} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-brand-green/10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-green">
              About {cityName} real estate
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-brand-charcoal">
              Why buyers look here
            </h2>
            <p className="text-base sm:text-[17px] text-brand-charcoal/75 leading-relaxed">
              {copy.about}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gray-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-brand-charcoal/70">
                <MapPin className="w-4 h-4 text-brand-green shrink-0" />
                <p className="text-sm font-medium">
                  {isLoading
                    ? `Loading listings in ${cityName}…`
                    : listingCount > 0
                      ? `${listingCount} ${listingLabel} in ${cityName}`
                      : `Verified listings in ${cityName}`}
                </p>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-brand-charcoal">
                Available properties
              </h2>
            </div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-green hover:text-brand-dark transition-colors"
            >
              Browse all cities <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center space-y-3 border border-brand-green/10">
              <h3 className="font-serif text-2xl font-semibold text-brand-charcoal">
                No listings in {cityName} yet
              </h3>
              <p className="text-base text-brand-charcoal/70 max-w-md mx-auto">
                New properties for this city will appear here as they are published from the admin panel.
              </p>
              <Link
                href="/list-your-property"
                className="inline-flex items-center justify-center gap-2 mt-2 px-5 py-3 bg-brand-green hover:bg-brand-dark text-white text-xs font-bold uppercase tracking-[0.14em] rounded-xl transition-colors"
              >
                List a property in {cityName}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((property) => (
                <PropertyCard key={property.id} property={property} variant="B" />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
