'use client'

import * as React from 'react'
import Link from 'next/link'
import { PROPERTIES, Property } from '@/data/properties'
import { getApiBaseUrl } from '@/utils/api'
import { mapBackendProperty } from '@/utils/mapListing'
import { PropertyGrid } from '@/components/real-estate/PropertyGrid'
import { useSavedStore } from '@/stores/saved.store'
import { Bookmark, Trash2, ArrowRight } from 'lucide-react'
import { PageSection } from '@/components/layout/PageSection'

export default function SavedPropertiesPage() {
  const [mounted, setMounted] = React.useState(false)
  const propertyIds = useSavedStore((state) => state.propertyIds)
  const clearAll = useSavedStore((state) => state.clearAll)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Saved IDs may belong to live DB listings (Mongo _id), not only the static demo data
  const [liveProperties, setLiveProperties] = React.useState<Property[]>([])

  React.useEffect(() => {
    if (!mounted || propertyIds.length === 0) return
    let isSubscribed = true
    const loadLive = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/public/properties`).catch(() => null)
        if (res && res.ok && isSubscribed) {
          const data = await res.json().catch(() => [])
          if (Array.isArray(data)) setLiveProperties(data.map((item) => mapBackendProperty(item)))
        }
      } catch (e) {
        console.error('Failed to load saved properties:', e)
      }
    }
    loadLive()
    return () => {
      isSubscribed = false
    }
  }, [mounted, propertyIds.length])

  const savedProperties = React.useMemo(() => {
    if (!mounted) return []
    const pool = [...liveProperties, ...PROPERTIES.filter((p) => !liveProperties.some((l) => l.id === p.id))]
    return pool.filter((p) => propertyIds.includes(p.id))
  }, [mounted, propertyIds, liveProperties])

  return (
    <div>
      <PageSection tone="white">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-soft border border-brand-green/20 rounded-full">
              <Bookmark className="w-3.5 h-3.5 text-brand-green fill-brand-green" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green">
                PRIVATE CLIENT VAULT
              </span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#171A18] font-semibold">
              Bookmarked Estates & Saved Residences
            </h1>
            <p className="text-base text-[#171A18]/70 font-normal max-w-2xl">
              Your curated portfolio of bookmarked properties across Bandra, Assagao, and Gurgaon.
            </p>
          </div>

          {savedProperties.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Saved Vault</span>
            </button>
          )}
        </div>
      </PageSection>

      <PageSection tone="muted">
        {savedProperties.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white rounded-2xl border border-brand-green/15 space-y-6 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-brand-soft border border-brand-green/20 text-brand-green flex items-center justify-center mx-auto">
              <Bookmark className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-2xl text-[#171A18] font-semibold">Your Private Vault is Empty</h3>
              <p className="text-base text-[#171A18]/70 font-normal max-w-md mx-auto leading-relaxed">
                Click the bookmark icon on any House & Sky residence card to save properties directly to your private dashboard.
              </p>
            </div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
            >
              <span>Explore Property Catalog</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <span className="text-xs font-bold text-[#0B4F3C] uppercase tracking-wider">
              Showing {savedProperties.length} Saved {savedProperties.length === 1 ? 'Residence' : 'Residences'}
            </span>
            <PropertyGrid properties={savedProperties} columns={3} variant="B" />
          </div>
        )}
      </PageSection>
    </div>
  )
}
