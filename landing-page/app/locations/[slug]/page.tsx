import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LOCATIONS } from '@/data/locations'
import { PROPERTIES } from '@/data/properties'
import { PropertyGrid } from '@/components/real-estate/PropertyGrid'
import { SectionHeading } from '@/components/real-estate/SectionHeading'
import { Sparkles, ChevronRight } from 'lucide-react'
import { PageSection } from '@/components/layout/PageSection'

interface LocationPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  return LOCATIONS.map((l) => ({
    slug: l.slug,
  }))
}

export async function generateMetadata({ params }: LocationPageProps) {
  const resolvedParams = await params
  const location = LOCATIONS.find((l) => l.slug === resolvedParams.slug)
  if (!location) return { title: 'Location Not Found' }

  return {
    title: `${location.name} Luxury Real Estate — Aura Véloce`,
    description: location.description,
  }
}

export default async function LocationDetailPage({ params }: LocationPageProps) {
  const resolvedParams = await params
  const location = LOCATIONS.find((l) => l.slug === resolvedParams.slug)

  if (!location) {
    notFound()
  }

  // Filter properties in this city
  const cityProperties = PROPERTIES.filter((p) =>
    p.location.city.toLowerCase().includes(location.name.toLowerCase()) ||
    (location.slug === 'delhi-ncr' && p.location.city.toLowerCase().includes('delhi'))
  )

  return (
    <div>
      <section className="relative min-h-[60vh] flex items-end pb-12 overflow-hidden bg-brand-charcoal">
        <Image
          src={location.heroImage}
          alt={location.name}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/25" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4">
          <nav className="flex items-center space-x-2 text-xs text-white/70 mb-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-3 h-3 text-white/40" />
            <Link href="/locations" className="hover:text-white">Locations</Link>
            <ChevronRight className="w-3 h-3 text-white/40" />
            <span className="text-white">{location.name}</span>
          </nav>

          <span className="px-3 py-1 bg-[#C9A96E] text-brand-charcoal text-xs uppercase tracking-[0.18em] font-bold">
            {location.state} Market Intelligence
          </span>

          <h1 className="font-serif text-4xl sm:text-6xl text-white font-semibold">
            {location.name} Luxury Real Estate
          </h1>

          <p className="text-base sm:text-lg text-white/80 font-normal max-w-2xl leading-relaxed">
            {location.description}
          </p>
        </div>
      </section>

      <PageSection tone="muted">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <span className="block text-xs uppercase tracking-widest text-brand-green font-bold">AVG PRICE / SQ FT</span>
            <span className="text-2xl font-semibold text-brand-charcoal font-serif">{location.avgPriceSqFt}</span>
          </div>
          <div className="space-y-1">
            <span className="block text-xs uppercase tracking-widest text-brand-green font-bold">YOY CAPITAL GROWTH</span>
            <span className="text-2xl font-semibold text-emerald-700 font-serif">{location.yoyGrowth}</span>
          </div>
          <div className="space-y-1">
            <span className="block text-xs uppercase tracking-widest text-brand-green font-bold">ACTIVE ESTATES</span>
            <span className="text-2xl font-semibold text-brand-charcoal font-serif">{location.activeListingsCount} Available</span>
          </div>
          <div className="space-y-1">
            <span className="block text-xs uppercase tracking-widest text-brand-green font-bold">PRIMARY PRECINCTS</span>
            <span className="text-2xl font-semibold text-brand-charcoal font-serif">{location.topNeighborhoods.length} Neighborhoods</span>
          </div>
        </div>
      </PageSection>

      <PageSection tone="white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 space-y-4">
            <h3 className="font-serif text-2xl sm:text-3xl text-brand-charcoal font-semibold">Top Neighborhood Precincts</h3>
            <div className="flex flex-wrap gap-2">
              {location.topNeighborhoods.map((n) => (
                <span
                  key={n}
                  className="px-3.5 py-1.5 bg-gray-100 border border-brand-green/15 text-sm text-brand-charcoal font-medium rounded-full"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
          <div className="lg:col-span-6 space-y-4">
            <h3 className="font-serif text-2xl sm:text-3xl text-brand-charcoal font-semibold">Precinct Highlights</h3>
            <ul className="space-y-2 text-base text-brand-charcoal/70">
              {location.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C9A96E] shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PageSection>

      <PageSection tone="muted">
        <SectionHeading
          eyebrow={`${location.name} Portfolio`}
          title={`Featured Residences in ${location.name}`}
          subtitle={`Explore available luxury penthouses and estates in ${location.name}.`}
        />
        <PropertyGrid properties={cityProperties} columns={3} variant="B" />
      </PageSection>
    </div>
  )
}
