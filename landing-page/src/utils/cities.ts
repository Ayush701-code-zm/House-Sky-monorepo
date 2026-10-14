'use client'

import * as React from 'react'
import { getApiBaseUrl } from '@/utils/api'

/** City configured by admins/managers in the admin panel (Cities & Locations). */
export interface PublicCity {
  _id: string
  name: string
  state?: string
  imageUrl?: string
  latitude?: number | null
  longitude?: number | null
}

/** Lowercase hyphenated slug: "Delhi NCR" → "delhi-ncr". */
export function cityToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function cityPageHref(name: string): string {
  return `/properties/city/${cityToSlug(name)}`
}

/** A listing belongs on a city page when its city slug matches the route. */
export function propertyMatchesCitySlug(propertyCity: string, slug: string): boolean {
  return cityToSlug(propertyCity) === slug
}

/** Built-in list used only until admins configure their own cities. */
export const DEFAULT_CITY_NAMES = [
  'Dholera', 'Noida', 'Bhopal', 'Narmadapuram', 'Ahmedabad', 'Delhi NCR',
  'Gurgaon', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Indore',
  'Jaipur', 'Lucknow', 'Surat', 'Kolkata', 'Chennai', 'Goa',
  'Chandigarh', 'Ayodhya', 'Thane', 'Navi Mumbai', 'Nagpur', 'Ludhiana', 'Patna',
  'Ujjain', 'Gwalior', 'Satpura',
]

/**
 * Local city card/hero images under `/images/cities`.
 * Keys are lowercase display names; aliases (e.g. Bengaluru) share a file.
 * Admin `imageUrl` still wins when present.
 */
export const DEFAULT_CITY_IMAGES: Record<string, string> = {
  surat: '/images/cities/surat.png',
  satpura: '/images/cities/satpura.png',
  lucknow: '/images/cities/lucknow.png',
  chandigarh: '/images/cities/chandigarh.png',
  patna: '/images/cities/patna.png',
  pune: '/images/cities/pune.png',
  hyderabad: '/images/cities/hyderabad.png',
  ludhiana: '/images/cities/ludhiana.png',
  jaipur: '/images/cities/jaipur.png',
  bangalore: '/images/cities/bangalore.png',
  bengaluru: '/images/cities/bangalore.png',
  chennai: '/images/cities/chennai.png',
  ayodhya: '/images/cities/ayodhya.png',
  ujjain: '/images/cities/ujjain.png',
  nagpur: '/images/cities/nagpur.png',
  kolkata: '/images/cities/kolkata.png',
  mumbai: '/images/cities/mumbai.png',
  bhopal: '/images/cities/bhopal.png',
  indore: '/images/cities/indore.png',
  gwalior: '/images/cities/gwalior.png',
}

/** Local fallback image for a city name; undefined when we have no asset. */
export function getCityImage(name: string): string | undefined {
  if (!name?.trim()) return undefined
  return DEFAULT_CITY_IMAGES[name.toLowerCase().trim()]
}

export interface CityPageCopy {
  eyebrow: string
  headline: string
  tagline: string
  about: string
}

const DEFAULT_CITY_COPY: CityPageCopy = {
  eyebrow: 'Verified city inventory',
  headline: 'Properties for sale & investment',
  tagline: 'Browse verified plots, villas, apartments and commercial spaces curated by House & Sky.',
  about:
    'Explore RERA-aware listings with clear locality context, pricing, and on-ground support. New inventory is added as projects and direct listings go live.',
}

/** Short market copy for city landing pages (Magicbricks-style snapshot). */
const CITY_PAGE_COPY: Record<string, CityPageCopy> = {
  mumbai: {
    eyebrow: 'Financial capital · Maharashtra',
    headline: 'Properties in Mumbai',
    tagline: 'Sea-facing residences, premium apartments and investor-grade plots across Mumbai’s most sought-after micro-markets.',
    about:
      'Mumbai remains India’s financial and entertainment capital, with sustained demand across Bandra, Worli, Juhu, Powai and the western suburbs. Buyers look for ready homes near transit, while investors track sea-facing and commercial corridors. House & Sky lists verified residences and land parcels with transparent pricing and site-visit support.',
  },
  bangalore: {
    eyebrow: 'Tech capital · Karnataka',
    headline: 'Properties in Bangalore',
    tagline: 'Plots and homes near IT corridors, ring roads and emerging residential townships.',
    about:
      'Bengaluru’s growth along Whitefield, Electronic City, Sarjapur and the Peripheral Ring Road continues to drive plot and apartment demand. House & Sky highlights verified inventory with clear connectivity and investment context.',
  },
  bengaluru: {
    eyebrow: 'Tech capital · Karnataka',
    headline: 'Properties in Bengaluru',
    tagline: 'Plots and homes near IT corridors, ring roads and emerging residential townships.',
    about:
      'Bengaluru’s growth along Whitefield, Electronic City, Sarjapur and the Peripheral Ring Road continues to drive plot and apartment demand. House & Sky highlights verified inventory with clear connectivity and investment context.',
  },
  pune: {
    eyebrow: 'IT & education hub · Maharashtra',
    headline: 'Properties in Pune',
    tagline: 'Residential plots, villas and apartments across established and expanding Pune localities.',
    about:
      'Pune blends education, IT and manufacturing demand — Hinjewadi, Baner, Wakad and the eastern belt remain active for homes and plots. Browse verified listings with locality clarity and guided site visits.',
  },
  hyderabad: {
    eyebrow: 'Pharma & IT corridor · Telangana',
    headline: 'Properties in Hyderabad',
    tagline: 'Land and residential inventory near Gachibowli, ORR and growing suburban belts.',
    about:
      'Hyderabad’s ORR and HITEC City corridors keep residential and plot demand firm. House & Sky surfaces verified options with pricing and location context for end-users and investors.',
  },
  chennai: {
    eyebrow: 'Coastal metro · Tamil Nadu',
    headline: 'Properties in Chennai',
    tagline: 'Homes and land parcels across Chennai’s residential and industrial growth pockets.',
    about:
      'Chennai’s coastal economy and industrial belts support steady housing demand from OMR to the western suburbs. Explore verified listings curated for clarity on location, ticket size and use-case.',
  },
  kolkata: {
    eyebrow: 'Eastern metro · West Bengal',
    headline: 'Properties in Kolkata',
    tagline: 'Apartments, plots and investment options across Kolkata’s established and emerging localities.',
    about:
      'Kolkata offers a mix of heritage localities and newer residential belts. House & Sky lists verified inventory so buyers can compare localities, pricing and property type in one place.',
  },
  jaipur: {
    eyebrow: 'Pink City · Rajasthan',
    headline: 'Properties in Jaipur',
    tagline: 'Plots and homes across Jaipur’s expanding residential and township corridors.',
    about:
      'Jaipur’s ring-road and satellite township growth continues to attract end-users and plot investors. Browse verified listings with clear locality and pricing context.',
  },
  lucknow: {
    eyebrow: 'State capital · Uttar Pradesh',
    headline: 'Properties in Lucknow',
    tagline: 'Residential plots and homes in Lucknow’s active growth corridors.',
    about:
      'Lucknow’s infrastructure push and expanding residential belts make it a strong mid-market and plot destination. House & Sky surfaces verified inventory with on-ground support.',
  },
  surat: {
    eyebrow: 'Diamond & textile hub · Gujarat',
    headline: 'Properties in Surat',
    tagline: 'Plots and residences across Surat’s fast-growing residential markets.',
    about:
      'Surat’s industrial strength and expanding suburbs keep housing and plot demand active. Explore verified listings curated for investors and end-users.',
  },
  indore: {
    eyebrow: 'Commercial hub · Madhya Pradesh',
    headline: 'Properties in Indore',
    tagline: 'Plots, homes and commercial options in Indore’s high-demand localities.',
    about:
      'Indore’s commercial growth and improving connectivity continue to support residential and plot absorption. House & Sky lists verified inventory with clear city context.',
  },
  bhopal: {
    eyebrow: 'Capital city · Madhya Pradesh',
    headline: 'Properties in Bhopal',
    tagline: 'Verified plots and residences across Bhopal’s planned and emerging belts.',
    about:
      'Bhopal offers comparatively measured ticket sizes with planned residential expansion. Browse verified listings and request site visits through House & Sky.',
  },
  chandigarh: {
    eyebrow: 'UT & tricity hub',
    headline: 'Properties in Chandigarh',
    tagline: 'Homes and investment options across Chandigarh and the wider tricity region.',
    about:
      'Chandigarh’s planned layout and tricity spillover into Mohali and Panchkula sustain premium residential demand. Explore verified listings with locality clarity.',
  },
  ayodhya: {
    eyebrow: 'Spiritual capital · Uttar Pradesh',
    headline: 'Properties in Ayodhya',
    tagline: 'Land and residential opportunities in one of India’s fastest-watched growth cities.',
    about:
      'Ayodhya’s infrastructure and hospitality-led expansion is reshaping local real estate. House & Sky highlights verified plots and homes with transparent guidance.',
  },
  nagpur: {
    eyebrow: 'Orange City · Maharashtra',
    headline: 'Properties in Nagpur',
    tagline: 'Plots and residences across Nagpur’s logistics and residential growth belts.',
    about:
      'Nagpur’s central location and logistics connectivity support steady residential and plot demand. Browse verified inventory curated by House & Sky.',
  },
  ludhiana: {
    eyebrow: 'Industrial hub · Punjab',
    headline: 'Properties in Ludhiana',
    tagline: 'Homes and land parcels across Ludhiana’s active residential markets.',
    about:
      'Ludhiana’s industrial base underpins housing demand across established and peripheral localities. Explore verified listings with clear pricing context.',
  },
  patna: {
    eyebrow: 'State capital · Bihar',
    headline: 'Properties in Patna',
    tagline: 'Residential and plot options in Patna’s expanding urban corridors.',
    about:
      'Patna’s urban expansion and infrastructure upgrades continue to open residential and plot opportunities. House & Sky lists verified inventory for serious buyers.',
  },
  ujjain: {
    eyebrow: 'Temple city · Madhya Pradesh',
    headline: 'Properties in Ujjain',
    tagline: 'Land and residential opportunities around Ujjain’s cultural and urban growth zones.',
    about:
      'Ujjain combines pilgrimage-led footfall with steady local housing needs. Browse verified plots and homes with House & Sky guidance.',
  },
  gwalior: {
    eyebrow: 'Historic city · Madhya Pradesh',
    headline: 'Properties in Gwalior',
    tagline: 'Plots and residences across Gwalior’s established and expanding localities.',
    about:
      'Gwalior’s improving connectivity and urban expansion support residential and plot demand. Explore verified listings curated for clarity and site visits.',
  },
  satpura: {
    eyebrow: 'Hill & forest belt · Madhya Pradesh',
    headline: 'Properties in Satpura',
    tagline: 'Nature-proximate land and investment parcels in the Satpura region.',
    about:
      'The Satpura belt attracts buyers seeking land near forest and hill landscapes. House & Sky surfaces verified parcels with transparent location context.',
  },
  dholera: {
    eyebrow: 'SIR & smart city · Gujarat',
    headline: 'Properties in Dholera',
    tagline: 'Demarcated plots and township inventory in Gujarat’s flagship greenfield corridor.',
    about:
      'Dholera SIR is among India’s most watched greenfield investment destinations. Explore verified plot inventory with clear layout and acquisition guidance from House & Sky.',
  },
  ahmedabad: {
    eyebrow: 'Commercial capital · Gujarat',
    headline: 'Properties in Ahmedabad',
    tagline: 'Plots, homes and commercial options across Ahmedabad’s growth corridors.',
    about:
      'Ahmedabad’s industrial and residential expansion — including SG Highway and satellite townships — keeps inventory active. Browse verified listings with House & Sky.',
  },
  noida: {
    eyebrow: 'NCR growth corridor · Uttar Pradesh',
    headline: 'Properties in Noida',
    tagline: 'Apartments, plots and commercial spaces across Noida and the expressway belt.',
    about:
      'Noida and the Yamuna Expressway corridor remain core NCR investment markets. House & Sky lists verified inventory with locality and pricing clarity.',
  },
  gurgaon: {
    eyebrow: 'Millennium City · Haryana',
    headline: 'Properties in Gurgaon',
    tagline: 'Premium residences and investment options across Gurgaon’s Golf Course and Dwarka Expressway belts.',
    about:
      'Gurgaon’s corporate hubs and expressway corridors drive sustained residential demand. Explore verified listings curated for end-users and investors.',
  },
  'delhi ncr': {
    eyebrow: 'National Capital Region',
    headline: 'Properties in Delhi NCR',
    tagline: 'Homes, plots and commercial inventory across Delhi NCR’s connected markets.',
    about:
      'Delhi NCR spans premium city cores and high-growth satellite towns. House & Sky helps you compare verified listings across key NCR micro-markets.',
  },
}

export function getCityPageCopy(name: string): CityPageCopy {
  const key = name.toLowerCase().trim()
  const known = CITY_PAGE_COPY[key]
  if (known) return known
  return {
    ...DEFAULT_CITY_COPY,
    headline: `Properties in ${name}`,
    tagline: `Verified plots, villas, apartments and commercial listings in ${name}.`,
    about: `${name} is part of House & Sky’s active city network. Browse RERA-aware inventory with clear pricing, locality context and support for site visits as new listings go live.`,
  }
}

// One request per page load, shared by every component that needs cities.
let citiesPromise: Promise<PublicCity[]> | null = null

function fetchCities(): Promise<PublicCity[]> {
  if (!citiesPromise) {
    citiesPromise = fetch(`${getApiBaseUrl()}/public/cities`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => (Array.isArray(data) ? data : []))
      .catch(() => {
        citiesPromise = null // allow a retry on the next mount
        return []
      })
  }
  return citiesPromise
}

/** Admin-configured cities; `loaded` flips true once the request settles. */
export function useConfiguredCities() {
  const [cities, setCities] = React.useState<PublicCity[]>([])
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    let active = true
    fetchCities().then((list) => {
      if (!active) return
      setCities(list)
      setLoaded(true)
    })
    return () => {
      active = false
    }
  }, [])

  return { cities, loaded }
}

/** Case/spacing-insensitive exact match of free text (typed or spoken) to a city name. */
export function matchCityName(text: string, names: string[]): string | null {
  const q = text.toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim()
  if (!q) return null
  return names.find((n) => n.toLowerCase() === q) || null
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Closest configured city that has coordinates, with its distance in km. */
export function findNearestCity(lat: number, lng: number, cities: PublicCity[]): { city: PublicCity; km: number } | null {
  let best: { city: PublicCity; km: number } | null = null
  for (const city of cities) {
    if (typeof city.latitude !== 'number' || typeof city.longitude !== 'number') continue
    const km = distanceKm(lat, lng, city.latitude, city.longitude)
    if (!best || km < best.km) best = { city, km }
  }
  return best
}

/**
 * Fallback when no configured city has coordinates: ask OpenStreetMap which
 * town/city the visitor is in. Returns candidate names, most specific first.
 */
export async function reverseGeocodeCityNames(lat: number, lng: number): Promise<string[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&lat=${lat}&lon=${lng}`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return []
    const data = await res.json()
    const a = data?.address || {}
    return [a.city, a.town, a.village, a.county, a.state_district].filter(
      (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
    )
  } catch {
    return []
  }
}
