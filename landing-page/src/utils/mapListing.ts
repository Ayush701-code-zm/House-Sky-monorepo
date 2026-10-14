import { Property, PROPERTIES } from '@/data/properties'
import { getApiBaseUrl } from '@/utils/api'
import { FALLBACK_IMAGE } from '@/utils/siteConfig'

const TYPE_MAP: Record<string, Property['propertyType']> = {
  RESIDENTIAL_PLOT: 'Estate',
  LAND: 'Estate',
  COMMERCIAL: 'Commercial',
  SHOWROOM: 'Commercial',
  VILLA: 'Villa',
  APARTMENT: 'Apartment',
  STUDIO_APARTMENT: 'Apartment'
}

/** Maps a backend propertyType enum (e.g. RESIDENTIAL_PLOT) to the display type used by Property. */
export function mapPropertyType(rawType?: string): Property['propertyType'] {
  return (rawType && TYPE_MAP[rawType]) || 'Estate'
}

function formatInr(amount: number): string {
  if (!amount || amount <= 0) return ''
  if (amount >= 10000000) {
    const val = amount / 10000000
    const str = val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)
    return `₹${str} Cr`
  }
  if (amount >= 100000) {
    const val = amount / 100000
    const str = val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)
    return `₹${str} Lakh`
  }
  return `₹${amount.toLocaleString('en-IN')}`
}

function formatPriceDisplay(priceRange?: string, price?: number): string {
  if (priceRange && String(priceRange).trim()) {
    const str = String(priceRange).trim()
    if (str.startsWith('₹')) return str

    const matchRange = str.match(/^(\d+)\s*-\s*(\d+)$/)
    if (matchRange) {
      const min = Number(matchRange[1])
      const max = Number(matchRange[2])
      const minStr = formatInr(min) || `₹${min.toLocaleString('en-IN')}`
      const maxStr = formatInr(max) || `₹${max.toLocaleString('en-IN')}`
      return `${minStr} - ${maxStr}`
    }

    const num = Number(str)
    if (!isNaN(num) && num > 0) {
      return formatInr(num)
    }

    return `₹${str}`
  }

  const formatted = formatInr(price || 0)
  return formatted || 'Price on request'
}

export function mapBackendProperty(raw: any, options?: { useFallbackImage?: boolean }): Property {
  const price = Number(raw.price) || 0
  const galleryUrls = Array.isArray(raw.gallery)
    ? raw.gallery.map((item: any) => item?.url || item).filter(Boolean)
    : []
  const photo = raw.heroImage || galleryUrls[0] || ''
  const useFallback = options?.useFallbackImage !== false
  const hero = photo || (useFallback ? FALLBACK_IMAGE : '')

  return {
    id: String(raw._id || raw.slug),
    slug: raw.slug,
    title: raw.title,
    tagline: raw.tagline || '',
    description: raw.description || '',
    price,
    formattedPrice: formatPriceDisplay(raw.priceRange, price),
    pricePerSqFt: Number(raw.pricePerSqft) || 0,
    formattedPricePerSqFt: raw.pricePerSqft ? `₹${Number(raw.pricePerSqft).toLocaleString('en-IN')} / sq ft` : '',
    propertyType: mapPropertyType(raw.propertyType),
    listingType: raw.listingType === 'RENT' ? 'Rent' : raw.listingType === 'LEASE' ? 'Lease' : 'Buy',
    location: {
      city: raw.city || '',
      area: raw.area || raw.location || '',
      address: raw.address || [raw.village, raw.location, raw.city].filter(Boolean).join(', '),
      coordinates: { lat: 0, lng: 0 }
    },
    specs: {
      bedrooms: Number(raw.bedrooms) || 0,
      bathrooms: Number(raw.bathrooms) || 0,
      areaSqFt: Number(raw.areaSqft) || 0,
      parkingSpaces: Number(raw.parkingSpaces) || 0,
      yearBuilt: 2026
    },
    amenities: (raw.amenities || []).map((name: string) => ({ icon: 'Star', name })),
    features: (Array.isArray(raw.features) && raw.features.length > 0) ? raw.features : (raw.highlights || []),
    images: {
      hero,
      gallery: galleryUrls.length > 0 ? galleryUrls : (hero ? [hero] : [])
    },
    floorPlanUrl: raw.floorPlanUrl || '',
    agentId: 'agent-1',
    isFeatured: Boolean(raw.isFeatured),
    isSpotlight: Boolean(raw.isFeatured),
    isNew: true,
    status: raw.status === 'SOLD' ? 'Sold' : raw.status === 'BOOKED' ? 'Under Negotiation' : 'Available',
    createdAt: raw.createdAt || new Date().toISOString(),
    legalInfo: raw.legalInfo || { reraNumber: raw.reraNumber || '', titleType: raw.titleType || 'Freehold' }
  }
}

/** Public listings, or the built-in catalog when the API has none. */
export async function loadCatalogProperties(options?: { useFallbackImage?: boolean }): Promise<Property[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/public/properties`).catch(() => null)
    const data = res && res.ok ? await res.json().catch(() => []) : []
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => mapBackendProperty(item, options))
    }
  } catch (err) {
    console.error('Failed to load properties', err)
  }
  return PROPERTIES
}
