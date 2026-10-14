'use client'

import * as React from 'react'
import { getApiBaseUrl } from '@/utils/api'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'

export function DevelopmentFeature() {
  const [featuredProject, setFeaturedProject] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    fetchFeaturedProject()
  }, [])

  const fetchFeaturedProject = async () => {
    try {
      setIsLoading(true)
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/public/projects`).catch(() => null)
      if (res && res.ok) {
        const projects = await res.json().catch(() => null)
        if (Array.isArray(projects) && projects.length > 0) {
          setFeaturedProject(projects[0])
          return
        }
      }
    } catch (e) {
      // Quiet fallback to default featured project
    } finally {
      setIsLoading(false)
    }
  }

  const FALLBACK_BANNER =
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85&auto=format&fit=crop'
  // Hosts allowed in next.config.ts images.remotePatterns — avoid runtime Image crashes
  const ALLOWED_IMAGE_HOSTS = new Set([
    'res.cloudinary.com',
    'images.unsplash.com',
    'hsynr.s3.ap-south-1.amazonaws.com',
    's3.ap-south-1.amazonaws.com',
  ])
  const safeBanner = (url?: string | null) => {
    if (!url || typeof url !== 'string') return FALLBACK_BANNER
    if (url.startsWith('/')) return url
    try {
      const host = new URL(url).hostname
      return ALLOWED_IMAGE_HOSTS.has(host) ? url : FALLBACK_BANNER
    } catch {
      return FALLBACK_BANNER
    }
  }

  const name = featuredProject?.name || 'Royal Palms Executive City'
  const location = featuredProject?.location || 'Sector 150, Noida'
  const baseRate = featuredProject?.basePricePerSqft ? `₹${featuredProject.basePricePerSqft.toLocaleString('en-IN')}` : '₹4,500'
  // Prefer real banner; never use map-only placeholders like example.com from OCR probes
  const banner = safeBanner(
    featuredProject?.bannerImage && featuredProject.bannerImage !== featuredProject?.mapImageUrl
      ? featuredProject.bannerImage
      : featuredProject?.bannerImage || featuredProject?.mapImageUrl
  )
  const totalPlots = featuredProject?.totalPlots || 20
  const availablePlots = featuredProject?.availableCount !== undefined ? featuredProject.availableCount : totalPlots
  const linkHref = featuredProject?._id ? `/projects/${featuredProject._id}` : '/projects'

  return (
    <div className="relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Image */}
        <div className="lg:col-span-7 relative aspect-[16/10] w-full overflow-hidden bg-brand-charcoal">
          <Image
            src={banner}
            alt={name}
            fill
            className="object-cover"
          />
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 bg-brand-green text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded shadow-sm">
              Flagship Masterplan Township
            </span>
          </div>
        </div>

        {/* Right Info */}
        <div className="lg:col-span-5 p-8 sm:p-10 space-y-6">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-brand-green block">
              FEATURED LAND DEVELOPMENT
            </span>
            <h3 className="font-serif text-4xl sm:text-5xl text-brand-charcoal font-semibold leading-tight">
              {name}
            </h3>
            <p className="text-xs sm:text-sm text-brand-charcoal/70 font-light leading-relaxed flex items-center gap-1">
              <MapPin className="w-4 h-4 text-brand-green shrink-0" /> {location}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-brand-green/10 text-xs font-mono text-brand-charcoal/80">
            <div>
              <span className="block text-[10px] text-brand-charcoal/60 uppercase">BASE RATE</span>
              <span className="text-sm font-bold text-brand-charcoal font-sans">{baseRate} / sqft</span>
            </div>
            <div>
              <span className="block text-[10px] text-brand-charcoal/60 uppercase">AVAILABILITY</span>
              <span className="text-sm font-bold text-brand-green font-sans">{availablePlots} / {totalPlots} Plots</span>
            </div>
          </div>

          <Link
            href={linkHref}
            {...(featuredProject?._id ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-green text-white font-bold text-xs uppercase tracking-[0.18em] rounded-md hover:bg-brand-dark transition-all shadow-md cursor-pointer"
          >
            <span className="text-white">Explore Project Plots</span>
            <ArrowUpRight className="w-4 h-4 text-white" />
          </Link>
        </div>
      </div>
    </div>
  )
}
