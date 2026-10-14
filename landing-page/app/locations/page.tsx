'use client'

import * as React from 'react'
import { getApiBaseUrl } from '@/utils/api'
import { LocationCard } from '@/components/real-estate/LocationCard'
import { SectionHeading } from '@/components/real-estate/SectionHeading'
import { RefreshCw, MapPin } from 'lucide-react'
import { PageSection } from '@/components/layout/PageSection'

export default function LocationsPage() {
  const [locations, setLocations] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      setIsLoading(true)
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/public/locations`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setLocations(data)
          return
        }
      }
      setLocations([])
    } catch (e) {
      console.error('Failed to fetch locations:', e)
      setLocations([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageSection tone="white">
      <div className="flex items-start justify-between gap-4 mb-2">
        <SectionHeading
          eyebrow="GEOGRAPHIC ATELIER"
          title="Prime Real Estate Destinations"
          subtitle="Discover real estate market dynamics, plot inventory, and project layouts across our active location hubs."
        />
        <button
          onClick={fetchLocations}
          className="p-2.5 bg-brand-soft border border-brand-green/20 text-brand-green rounded-xl hover:bg-brand-green hover:text-white transition-all cursor-pointer shrink-0"
          title="Refresh live locations"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-16">
          <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-gray-100 border border-brand-green/15 rounded-2xl p-12 text-center space-y-3">
          <MapPin className="w-12 h-12 text-brand-green mx-auto" />
          <h3 className="font-serif text-2xl text-brand-charcoal font-semibold">No Active Locations Found</h3>
          <p className="text-base text-brand-charcoal/70">Create a real estate project in Admin Portal to populate live location hubs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {locations.map((loc) => (
            <LocationCard key={loc.id || loc.slug} location={loc} />
          ))}
        </div>
      )}
    </PageSection>
  )
}

