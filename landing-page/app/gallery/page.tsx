'use client'

import * as React from 'react'
import Image from 'next/image'
import { SectionHeading } from '@/components/real-estate/SectionHeading'
import { PageSection } from '@/components/layout/PageSection'
import { getApiBaseUrl } from '@/utils/api'
import { FALLBACK_IMAGE } from '@/utils/siteConfig'
import { X, ZoomIn, Image as ImageIcon } from 'lucide-react'

interface PublicGalleryItem {
  _id: string
  title: string
  imageUrl: string
  category?: string
  caption?: string
  order?: number
}

const CATEGORIES = ['All', 'Projects', 'Site Visits', 'Events', 'Infrastructure', 'General']

export default function GalleryPage() {
  const [items, setItems] = React.useState<PublicGalleryItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedCategory, setSelectedCategory] = React.useState('All')
  const [selectedItem, setSelectedItem] = React.useState<PublicGalleryItem | null>(null)

  React.useEffect(() => {
    const load = async () => {
      try {
        const baseUrl = getApiBaseUrl()
        const res = await fetch(`${baseUrl}/public/gallery`).catch(() => null)
        if (res && res.ok) {
          const data = await res.json().catch(() => [])
          setItems(Array.isArray(data) ? data : [])
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // Filter items by active category tab
  const filteredItems = React.useMemo(() => {
    if (selectedCategory === 'All') return items
    return items.filter(
      (item) => (item.category || 'General').toLowerCase() === selectedCategory.toLowerCase()
    )
  }, [items, selectedCategory])

  // Get available categories that actually have images (plus default categories)
  const availableCategories = React.useMemo(() => {
    const categoriesFromData = Array.from(new Set(items.map((i) => i.category || 'General')))
    const merged = ['All', ...Array.from(new Set([...CATEGORIES.slice(1), ...categoriesFromData]))]
    return merged
  }, [items])

  return (
    <>
    <PageSection tone="white">
      <SectionHeading
        eyebrow="EXCLUSIVES"
        title="Official Photo Gallery"
        subtitle="Explore verified project developments, site visit moments, township infrastructure, and event highlights."
      />

      {/* Category Tabs */}
      {!isLoading && items.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {availableCategories.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-dark text-white shadow-md shadow-brand-dark/20'
                    : 'bg-white border border-brand-green/20 text-brand-charcoal/70 hover:bg-brand-green/10 hover:text-brand-dark'
                }`}
              >
                {cat}
                {cat !== 'All' && (
                  <span className="ml-1.5 opacity-60 text-[10px]">
                    (
                    {cat === 'All'
                      ? items.length
                      : items.filter((i) => (i.category || 'General').toLowerCase() === cat.toLowerCase()).length}
                    )
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[4/3] bg-brand-light animate-pulse rounded-2xl border border-brand-green/10" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-brand-green/15 rounded-3xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-brand-dark mb-1">No Gallery Images Found</h3>
          <p className="text-xs text-brand-charcoal/60 max-w-md mx-auto">
            {items.length === 0
              ? 'No official gallery images have been uploaded yet. Upload images via the Admin Gallery Showcase panel.'
              : `No images available under the "${selectedCategory}" category.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelectedItem(item)}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-brand-dark/5 border border-brand-green/15 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <Image
                src={item.imageUrl || FALLBACK_IMAGE}
                alt={item.title || 'Gallery image'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
              
              {/* Category Badge */}
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-lg border border-white/20 uppercase tracking-wider">
                  {item.category || 'General'}
                </span>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h4 className="text-sm font-bold truncate">{item.title}</h4>
                    {item.caption && (
                      <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{item.caption}</p>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 ml-2">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageSection>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-neutral-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-neutral-950/50">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-brand-gold/20 text-brand-gold text-xs font-semibold rounded-lg uppercase tracking-wider">
                  {selectedItem.category || 'General'}
                </span>
                <h3 className="text-white text-base font-bold truncate">{selectedItem.title}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Preview Container */}
            <div className="relative flex-1 min-h-[300px] max-h-[70vh] bg-black flex items-center justify-center p-2">
              <Image
                src={selectedItem.imageUrl || FALLBACK_IMAGE}
                alt={selectedItem.title}
                fill
                className="object-contain p-2 rounded-xl"
                sizes="100vw"
                unoptimized
              />
            </div>

            {/* Modal Footer / Caption */}
            {selectedItem.caption && (
              <div className="p-4 bg-neutral-950/80 border-t border-white/10 text-white/80 text-xs">
                <p className="max-w-3xl leading-relaxed">{selectedItem.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

