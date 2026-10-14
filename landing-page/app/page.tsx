'use client'

import * as React from 'react'
import { getApiBaseUrl } from '@/utils/api'
import Image from 'next/image'
import Link from 'next/link'
import { SectionHeading } from '@/components/real-estate/SectionHeading'
import { DevelopmentFeature } from '@/components/real-estate/DevelopmentFeature'
import { MarketSnapshot } from '@/components/real-estate/MarketSnapshot'
import { DholeraArrivedSection } from '@/components/real-estate/DholeraArrivedSection'
import { IndiaIsRunningBanner } from '@/components/real-estate/IndiaIsRunningBanner'
import { PlotBuyingProcess } from '@/components/real-estate/PlotBuyingProcess'
import { HomepageContactSection } from '@/components/real-estate/HomepageContactSection'
import { LandInvestmentCalculator } from '@/components/real-estate/LandInvestmentCalculator'
import { WhyInvestSection } from '@/components/real-estate/WhyInvestSection'
import { LandPlotFAQ } from '@/components/real-estate/LandPlotFAQ'
import { BrandValuesSection } from '@/components/real-estate/BrandValuesSection'
import { TestimonialsCommunityInsights } from '@/components/real-estate/TestimonialsCommunityInsights'
import { PropertyCardSkeleton } from '@/components/common/Skeleton'
import { PropertyCard } from '@/components/real-estate/PropertyCard'
import { PropertySearch } from '@/components/real-estate/PropertySearch'
import { mapBackendProperty } from '@/utils/mapListing'
import { PROPERTIES } from '@/data/properties'
import { PageSection } from '@/components/layout/PageSection'
import {
  CheckCircle2,
  ArrowUpRight,
  MapPin,
  RefreshCw
} from 'lucide-react'

export default function HomePage() {
  const [projects, setProjects] = React.useState<any[]>([])
  // Showcase demos until the API has real listings; API data replaces demos when present.
  const [listings, setListings] = React.useState<any[]>(PROPERTIES)
  const [listingsFromApi, setListingsFromApi] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [frontendStats, setFrontendStats] = React.useState({
    projectsCount: '',
    advisorsCount: '',
    locationsCount: '',
    revenue: ''
  })

  React.useEffect(() => {
    fetchLiveProjects()
  }, [])

  const fetchLiveProjects = async () => {
    try {
      setIsLoading(true)
      const baseUrl = getApiBaseUrl()
      const [projectRes, propertyRes, statsRes] = await Promise.all([
        fetch(`${baseUrl}/public/projects`).catch(() => null),
        fetch(`${baseUrl}/public/properties`).catch(() => null),
        fetch(`${baseUrl}/public/frontend-stats`).catch(() => null)
      ])
      if (projectRes && projectRes.ok) {
        const data = await projectRes.json().catch(() => null)
        setProjects(Array.isArray(data) ? data : [])
      }
      if (propertyRes && propertyRes.ok) {
        const data = await propertyRes.json().catch(() => [])
        if (Array.isArray(data) && data.length > 0) {
          setListings(data)
          setListingsFromApi(true)
        } else {
          setListings(PROPERTIES)
          setListingsFromApi(false)
        }
      }
      if (statsRes && statsRes.ok) {
        const data = await statsRes.json().catch(() => null)
        if (data) setFrontendStats(data)
      }
    } catch (e) {
      console.error('Failed to fetch live inventory', e)
    } finally {
      setIsLoading(false)
    }
  }

  const stats = [
    { label: 'TOWNSHIP DEVELOPMENTS', value: frontendStats.projectsCount || `${projects.length || 6} Projects` },
    { label: 'COMMUNITY ADVISORS', value: frontendStats.advisorsCount || '45+ Team' },
    { label: 'PRIME LOCATIONS', value: frontendStats.locationsCount || '6 Enclaves' },
    { label: 'DEMARCATED LAND MANIFEST', value: frontendStats.revenue || '₹120 Cr+' },
  ]

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85svh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden bg-brand-charcoal text-white pt-4">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-top opacity-70"
          >
            <source src="/videos/hero-banner-video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20" />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full pt-16 pb-28 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-left">
              <div className="space-y-3 sm:space-y-4">
                <h1 className="font-serif text-4xl min-[375px]:text-5xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.12] text-white tracking-tight">
                  Prime Real Estate Land Plots & Townships
                </h1>
                <p className="text-base sm:text-lg text-white/80 font-normal leading-relaxed max-w-xl">
                  Representing India&apos;s premier masterplan township projects, demarcated plot layouts, and high-yield real estate land acquisitions.
                </p>
              </div>

              <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  href="/projects"
                  className="w-full sm:w-auto px-6 py-4 sm:py-3.5 bg-brand-green hover:bg-brand-dark text-white font-bold text-xs uppercase tracking-[0.16em] rounded-xl transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <span>Explore All Plot Projects</span>
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </Link>

                <Link
                  href="/contact"
                  className="w-full sm:w-auto px-6 py-4 sm:py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-xs text-center uppercase tracking-[0.16em] rounded-xl transition-all shadow-sm min-h-[44px] flex items-center justify-center"
                >
                  Schedule Site Tour
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <PageSection tone="muted" className="relative z-20" innerClassName="space-y-10">
        <div className="-mt-28 sm:-mt-24">
          <PropertySearch />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-white border border-brand-green/10 rounded-2xl p-6 sm:p-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center space-y-1">
              <span className="block text-xs font-bold tracking-[0.18em] text-brand-green uppercase">
                {s.label}
              </span>
              <span className="text-3xl sm:text-4xl font-serif text-brand-charcoal font-semibold block">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection tone="white">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <SectionHeading
            eyebrow="TOWNSHIPS & MASTERPLANS"
            title="Featured Plot Projects."
            subtitle="Real-time availability of demarcated plots across active townships."
            action={{ label: 'View all projects →', href: '/projects' }}
          />
          <button
            onClick={fetchLiveProjects}
            className="p-2.5 bg-brand-soft border border-brand-green/20 text-brand-green rounded-xl hover:bg-brand-green hover:text-white transition-all cursor-pointer self-start sm:self-auto"
            title="Refresh database plot counts"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {isLoading ? (
          <PropertyCardSkeleton count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.slice(0, 3).map((proj) => (
              <Link
                key={proj._id}
                href={`/projects/${proj._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-brand-green/10 hover:shadow-xl hover:border-brand-green/30 transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-brand-charcoal">
                  <Image
                    src={proj.bannerImage || 'https://images.unsplash.com/photo-1582407947304-fd86f28f3fdc?w=800&q=80'}
                    alt={proj.name || 'Project'}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${proj.status === 'ACTIVE' ? 'bg-emerald-500 text-white' :
                      proj.status === 'UPCOMING' ? 'bg-amber-400 text-amber-900' :
                        'bg-sky-500 text-white'
                      }`}>
                      {proj.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white font-mono text-[10px] rounded-lg">{proj.code}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-white/70 text-xs flex items-center gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" /> {proj.location}
                    </p>
                    <h3 className="font-serif text-2xl font-semibold text-white group-hover:text-[#C9A96E] transition-colors leading-tight">
                      {proj.name}
                    </h3>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#E8F0EC] rounded-xl p-2 border border-brand-green/15">
                      <span className="text-[9px] text-brand-charcoal/60 font-bold uppercase block">Total</span>
                      <span className="text-sm font-extrabold text-brand-charcoal">{proj.totalPlots || 0}</span>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-200">
                      <span className="text-[9px] text-emerald-700 font-bold uppercase block">Available</span>
                      <span className="text-sm font-extrabold text-emerald-700">{proj.availableCount ?? 0}</span>
                    </div>
                    <div className="bg-red-50 rounded-xl p-2 border border-red-200">
                      <span className="text-[9px] text-red-700 font-bold uppercase block">Sold</span>
                      <span className="text-sm font-extrabold text-red-700">{(proj.bookedCount ?? 0) + (proj.soldCount ?? 0)}</span>
                    </div>
                  </div>

                  {(proj.priceRange || proj.basePricePerSqft) && (
                    <div className="text-xs font-bold text-brand-green bg-[#E8F0EC] px-3 py-1.5 rounded-lg border border-brand-green/15 text-center">
                      {proj.priceRange || `₹${proj.basePricePerSqft?.toLocaleString('en-IN')} / sq ft`}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-xs text-brand-charcoal/50 font-medium">
                      {proj.area || `${((proj.totalAreaSqft || 0) / 43560).toFixed(1)} Acres`}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-green group-hover:gap-2 transition-all">
                      Explore Plots <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageSection>

      {listings.length > 0 && (
        <PageSection tone="muted">
          <SectionHeading
            eyebrow="PREMIUM PROPERTIES"
            title="Premium properties, separate from townships."
            subtitle="Residential plots, commercial units, villas and showrooms listed independently of project plot inventory."
            action={{ label: 'View all properties →', href: '/properties' }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.slice(0, 6).map((item) => (
              <PropertyCard
                key={listingsFromApi ? (item._id || item.id) : item.id}
                property={listingsFromApi ? mapBackendProperty(item) : item}
                variant="B"
              />
            ))}
          </div>
        </PageSection>
      )}

      <DholeraArrivedSection />

      <PageSection tone="muted">
        <WhyInvestSection />
      </PageSection>

      <PageSection tone="white">
        <PlotBuyingProcess />
      </PageSection>

      <PageSection tone="muted">
        <LandInvestmentCalculator />
      </PageSection>

      <IndiaIsRunningBanner />

      <PageSection tone="white" innerClassName="space-y-16">
        <DevelopmentFeature />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 relative aspect-[4/3] rounded-xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1524813686514-a57563d77965?w=1000&q=80"
              alt="House & Sky Land Plot Demarcation"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs uppercase tracking-[0.18em] font-bold text-brand-green block">
              OUR PHILOSOPHY
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl text-brand-charcoal font-semibold leading-tight">
              Plot decisions deserve total title clarity.
            </h2>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-brand-charcoal text-base">Demarcated</h4>
                  <p className="text-sm text-brand-charcoal/70 font-normal">Every plot is surveyed with exact vector coordinates and boundary markers.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-brand-charcoal text-base">Transparent PLC</h4>
                  <p className="text-sm text-brand-charcoal/70 font-normal">Clear breakdown of 12m road, corner, and park-facing preferential location charges.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-brand-charcoal text-base">Legal Conveyance</h4>
                  <p className="text-sm text-brand-charcoal/70 font-normal">Full registry scheduling and title deed transfer upon milestone completion.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection tone="muted">
        <MarketSnapshot />
      </PageSection>

      <PageSection tone="white">
        <LandPlotFAQ />
      </PageSection>

      <PageSection tone="muted">
        <BrandValuesSection />
      </PageSection>

      <PageSection tone="white">
        <TestimonialsCommunityInsights />
      </PageSection>

      <HomepageContactSection />
    </div>
  )
}
