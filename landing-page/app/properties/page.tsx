'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Property, PROPERTIES } from '@/data/properties'
import { PropertyCard } from '@/components/real-estate/PropertyCard'
import { getApiBaseUrl } from '@/utils/api'
import { loadCatalogProperties, mapBackendProperty, mapPropertyType } from '@/utils/mapListing'
import { BulkBuyModal } from '@/components/real-estate/BulkBuyModal'
import { scrollToSection } from '@/utils/scroll'
import {
  DEFAULT_CITY_IMAGES,
  DEFAULT_CITY_NAMES,
  cityPageHref,
  cityToSlug,
  findNearestCity,
  getCityImage,
  matchCityName,
  reverseGeocodeCityNames,
  useConfiguredCities
} from '@/utils/cities'
import {
  Search,
  Building2,
  MapPin,
  Filter,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  PhoneCall,
  MessageCircle,
  X,
  Grid,
  List,
  Award,
  Flame,
  Home,
  Layers,
  Phone,
  Mic,
  Navigation,
  Loader2
} from 'lucide-react'

const PROPERTY_TYPE_OPTIONS = [
  { label: 'All Types', value: 'ALL' },
  { label: 'Residential Plot', value: 'RESIDENTIAL_PLOT' },
  { label: 'Commercial', value: 'COMMERCIAL' },
  { label: 'Luxury Villa', value: 'VILLA' },
  { label: 'Showroom', value: 'SHOWROOM' },
  { label: 'Apartment', value: 'APARTMENT' },
  { label: 'Studio Apartment', value: 'STUDIO_APARTMENT' },
  { label: 'Land', value: 'LAND' }
]

const BUDGET_OPTIONS = [
  { label: 'All Budgets', value: 'ALL', min: 0, max: Infinity },
  { label: 'Under ₹50 Lakhs', value: 'UNDER_50L', min: 0, max: 5000000 },
  { label: '₹50L - ₹1 Crore', value: '50L_1CR', min: 5000000, max: 10000000 },
  { label: '₹1 Cr - ₹3 Crores', value: '1CR_3CR', min: 10000000, max: 30000000 },
  { label: '₹3 Cr - ₹5 Crores', value: '3CR_5CR', min: 30000000, max: 50000000 },
  { label: 'Above ₹5 Crores', value: 'ABOVE_5CR', min: 50000000, max: Infinity }
]

function PropertiesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const typeParam = searchParams.get('type')
  let initialType = 'ALL'
  if (typeParam) {
    if (typeParam === 'Apartments') initialType = 'APARTMENT'
    else if (typeParam === 'Villas') initialType = 'VILLA'
    else if (typeParam === 'Plots') initialType = 'RESIDENTIAL_PLOT'
    else initialType = typeParam
  }

  // Admin-configured cities (admin panel → Cities & Locations) drive the city
  // dropdown, suggestions and city cards; the built-in list is only a fallback.
  const { cities: configuredCities, loaded: citiesLoaded } = useConfiguredCities()
  const cityNames = React.useMemo(
    () => (configuredCities.length > 0 ? configuredCities.map((c) => c.name) : DEFAULT_CITY_NAMES),
    [configuredCities]
  )
  const cityNamesRef = React.useRef(cityNames)
  cityNamesRef.current = cityNames
  const cityImageByName = React.useMemo(() => {
    const map: Record<string, string> = { ...DEFAULT_CITY_IMAGES }
    configuredCities.forEach((c) => {
      const key = c.name.toLowerCase()
      if (c.imageUrl) map[key] = c.imageUrl
      else if (!map[key]) {
        const local = getCityImage(c.name)
        if (local) map[key] = local
      }
    })
    return map
  }, [configuredCities])

  let initialCity = searchParams.get('city') || 'All Cities'
  let initialLocation = searchParams.get('location') || ''

  // Auto-promote known cities from search query to the City Dropdown
  if (initialLocation && initialCity === 'All Cities') {
    const exactMatch = matchCityName(initialLocation, DEFAULT_CITY_NAMES)
    if (exactMatch) {
      initialCity = exactMatch
      initialLocation = ''
    }
  }
  
  const intentParam = searchParams.get('intent')
  let initialListingType = 'ALL'
  if (intentParam) {
    const intentLower = intentParam.toLowerCase()
    if (['buy', 'new launch', 'projects', 'commercial', 'plots/land'].includes(intentLower)) {
      initialListingType = 'SALE'
      if (intentLower === 'commercial' && initialType === 'ALL') initialType = 'COMMERCIAL'
      if (intentLower === 'plots/land' && initialType === 'ALL') initialType = 'RESIDENTIAL_PLOT'
    }
    else if (intentLower === 'rent') initialListingType = 'RENT'
  }

  // Filter & Search States
  const [searchQuery, setSearchQuery] = React.useState(initialLocation)
  const [selectedCity, setSelectedCity] = React.useState(initialCity)
  const [selectedType, setSelectedType] = React.useState(initialType)
  const [selectedListingType, setSelectedListingType] = React.useState(initialListingType)
  const [selectedBudget, setSelectedBudget] = React.useState('ALL')
  const [onlyVerified, setOnlyVerified] = React.useState(false)
  const [sortBy, setSortBy] = React.useState('FEATURED')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')

  // Set when a search/filter asks for results; the fetch effect re-aligns the
  // scroll once fresh results have rendered (layout above the grid can shift).
  const pendingScrollRef = React.useRef(false)
  const scrollToResults = (blur = false) => {
    pendingScrollRef.current = true
    scrollToSection('properties-grid', { blur })
  }

  React.useEffect(() => {
    // 'nearby=true' has no textual location; a placeholder search term would match nothing
    let loc = searchParams.get('location') || ''
    let city = searchParams.get('city') || 'All Cities'
    if (loc && city === 'All Cities') {
      const exactMatch = matchCityName(loc, cityNamesRef.current)
      if (exactMatch) {
        city = exactMatch
        // Do not clear loc, let it stay in the input box so the user sees their search
      }
    }
    setSearchQuery(loc)
    setSelectedCity(city)

    const t = searchParams.get('type')
    if (t) {
      if (t === 'Apartments') setSelectedType('APARTMENT')
      else if (t === 'Villas') setSelectedType('VILLA')
      else if (t === 'Plots') setSelectedType('RESIDENTIAL_PLOT')
      else setSelectedType(t)
    } else {
      setSelectedType('ALL')
    }

    const intent = searchParams.get('intent')
    if (intent) {
      const intentLower = intent.toLowerCase()
      if (['buy', 'new launch', 'projects', 'commercial', 'plots/land'].includes(intentLower)) {
        setSelectedListingType('SALE')
        if (intentLower === 'commercial' && !t) setSelectedType('COMMERCIAL')
        if (intentLower === 'plots/land' && !t) setSelectedType('RESIDENTIAL_PLOT')
      } else if (intentLower === 'rent') {
        setSelectedListingType('RENT')
      }
    } else {
      setSelectedListingType('ALL')
    }

    // Auto-scroll down to results section when navigated via search or query parameters
    if (searchParams.toString().length > 0) {
      scrollToResults()
    }
  }, [searchParams])

  // Admin cities arrive after the first render: promote a typed/linked search
  // that exactly names a configured city into the city filter.
  React.useEffect(() => {
    if (!citiesLoaded || configuredCities.length === 0) return
    setSelectedCity((current) => {
      if (current !== 'All Cities') return current
      return matchCityName(searchQuery, configuredCities.map((c) => c.name)) || current
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citiesLoaded, configuredCities])

  const [allProperties, setAllProperties] = React.useState<Property[]>(PROPERTIES)
  const [dbCities, setDbCities] = React.useState<string[]>([])
  const [dbLocations, setDbLocations] = React.useState<string[]>([])
  const [showLocationDropdown, setShowLocationDropdown] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isBulkBuyOpen, setIsBulkBuyOpen] = React.useState(false)
  const [isListening, setIsListening] = React.useState(false)
  const [isLocating, setIsLocating] = React.useState(false)
  const [searchNotice, setSearchNotice] = React.useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [catalog, setCatalog] = React.useState<Property[] | null>(null)

  // Typed or spoken text: a city name selects that city, anything else is a keyword search.
  const applySearchText = (text: string) => {
    const cleaned = text.trim()
    const city = matchCityName(cleaned, cityNamesRef.current)
    if (city) {
      setSelectedCity(city)
      setSearchQuery('')
    } else {
      setSearchQuery(cleaned)
    }
    setShowLocationDropdown(false)
    setSearchNotice(null)
    scrollToResults(true)
  }

  const applyNearby = async (lat: number, lng: number) => {
    setSearchNotice({ tone: 'info', text: 'Finding properties near you…' })
    const nearest = findNearestCity(lat, lng, configuredCities)
    if (nearest) {
      setSelectedCity(nearest.city.name)
      setSearchQuery('')
      setSearchNotice({
        tone: 'info',
        text: nearest.km < 50
          ? `Showing properties in ${nearest.city.name}, near your location.`
          : `Showing ${nearest.city.name} — the nearest city we list (~${Math.round(nearest.km)} km away).`
      })
      scrollToResults()
      return
    }
    // No configured city has coordinates — ask OpenStreetMap where the visitor is.
    const names = await reverseGeocodeCityNames(lat, lng)
    const match = names.map((n) => matchCityName(n, cityNamesRef.current)).find(Boolean)
    if (match) {
      setSelectedCity(match)
      setSearchQuery('')
      setSearchNotice({ tone: 'info', text: `Showing properties in ${match}, near your location.` })
    } else if (names[0]) {
      setSelectedCity('All Cities')
      setSearchQuery(names[0])
      setSearchNotice({ tone: 'info', text: `Showing properties matching “${names[0]}”, near your location.` })
    } else {
      setSearchNotice({ tone: 'error', text: 'Could not work out your city. Please type a city or locality instead.' })
      return
    }
    scrollToResults()
  }

  const handleNearbyClick = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setSearchNotice({ tone: 'error', text: 'Location is not supported in this browser. Please type a city instead.' })
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await applyNearby(position.coords.latitude, position.coords.longitude)
        setIsLocating(false)
      },
      (error) => {
        setIsLocating(false)
        setSearchNotice({
          tone: 'error',
          text: error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Allow location access in your browser, or type a city instead.'
            : 'Could not get your location. Please try again or type a city instead.'
        })
      },
      { timeout: 15000, maximumAge: 5 * 60 * 1000 }
    )
  }

  // "Nearby" from the home page search arrives as ?nearby=true&lat=..&lng=..
  const handledNearbyRef = React.useRef('')
  React.useEffect(() => {
    if (!citiesLoaded || searchParams.get('nearby') !== 'true') return
    const lat = Number(searchParams.get('lat'))
    const lng = Number(searchParams.get('lng'))
    const key = `${lat},${lng}`
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || handledNearbyRef.current === key) return
    handledNearbyRef.current = key
    applyNearby(lat, lng)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citiesLoaded, searchParams])

  const handleVoiceSearch = () => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSearchNotice({ tone: 'error', text: 'Voice search is not supported in this browser. Try Chrome, Edge or Safari.' })
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      if (transcript.trim()) applySearchText(transcript)
    }

    recognition.onerror = (event: any) => {
      setIsListening(false)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setSearchNotice({ tone: 'error', text: 'Microphone permission was denied. Allow microphone access to use voice search.' })
      } else if (event.error === 'no-speech') {
        setSearchNotice({ tone: 'error', text: 'Didn’t catch that — tap the mic and say a city or locality.' })
      } else if (event.error !== 'aborted') {
        setSearchNotice({ tone: 'error', text: 'Voice search failed. Please try again or type your search.' })
      }
    }

    recognition.onend = () => setIsListening(false)

    try {
      setSearchNotice(null)
      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  // Unfiltered catalog for city cards. The grid below is fetched with filters.
  React.useEffect(() => {
    let active = true
    loadCatalogProperties().then((list) => {
      if (active) setCatalog(list)
    })
    return () => {
      active = false
    }
  }, [])

  const cityCards = React.useMemo(() => {
    if (!catalog) return []
    const groups = new Map<string, { name: string; count: number }>()
    catalog.forEach((property) => {
      const raw = (property.location?.city || '').trim()
      if (!raw) return
      const key = cityToSlug(raw)
      const configuredName = configuredCities.find((city) => cityToSlug(city.name) === key)?.name
      const name = configuredName || raw
      const existing = groups.get(key)
      if (existing) existing.count += 1
      else groups.set(key, { name, count: 1 })
    })
    return [...groups.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [catalog, configuredCities])

  // Fetch unique location options dynamically from database API
  React.useEffect(() => {
    const fetchLocations = async () => {
      try {
        const baseUrl = getApiBaseUrl()
        const res = await fetch(`${baseUrl}/public/properties/locations`).catch(() => null)
        if (res && res.ok) {
          const data = await res.json().catch(() => ({}))
          if (Array.isArray(data.cities)) setDbCities(data.cities)
          if (Array.isArray(data.locations)) setDbLocations(data.locations)
        }
      } catch (e) {
        console.error('Failed to fetch DB locations:', e)
      }
    }
    fetchLocations()
  }, [])

  // Dynamically computed list of unique cities (combining API + Indian cities + loaded properties)
  const availableCities = React.useMemo(() => {
    let list: string[]
    if (configuredCities.length > 0) {
      list = configuredCities.map((c) => c.name) // keep the admin's display order
    } else {
      const set = new Set<string>([...DEFAULT_CITY_NAMES, ...dbCities])
      allProperties.forEach((p) => {
        if (p.location?.city && p.location.city.trim()) {
          set.add(p.location.city.trim())
        }
      })
      list = Array.from(set).sort()
    }
    // A city from a link/URL that isn't in the list must still show as selected.
    if (selectedCity !== 'All Cities' && !list.some((c) => c.toLowerCase() === selectedCity.toLowerCase())) {
      list = [...list, selectedCity]
    }
    return ['All Cities', ...list]
  }, [configuredCities, dbCities, allProperties, selectedCity])

  // Autocomplete Location Suggestions matching user searchQuery
  const locationSuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    const pool = new Set<string>()

    const suggestionCities = configuredCities.length > 0 ? configuredCities.map((c) => c.name) : dbCities
    suggestionCities.forEach((c) => {
      if (c.toLowerCase().includes(q)) pool.add(`City: ${c}`)
    })
    dbLocations.forEach((loc) => {
      if (loc.toLowerCase().includes(q)) pool.add(`Locality: ${loc}`)
    })
    allProperties.forEach((p) => {
      if (p.location?.area && p.location.area.toLowerCase().includes(q)) pool.add(`Area: ${p.location.area}`)
      if (p.title && p.title.toLowerCase().includes(q)) pool.add(`Project: ${p.title}`)
    })

    return Array.from(pool).slice(0, 8)
  }, [searchQuery, configuredCities, dbCities, dbLocations, allProperties])

  // Fetch properties from backend API with location-wise & parameter query string
  React.useEffect(() => {
    let isSubscribed = true
    const loadProperties = async () => {
      try {
        const baseUrl = getApiBaseUrl()
        const queryParams = new URLSearchParams()
        if (selectedCity !== 'All Cities') queryParams.set('city', selectedCity)
        if (selectedType !== 'ALL') queryParams.set('propertyType', selectedType)
        if (selectedListingType !== 'ALL') queryParams.set('listingType', selectedListingType)
        if (searchQuery.trim()) queryParams.set('search', searchQuery.trim())
        if (onlyVerified) queryParams.set('onlyVerified', 'true')
        if (sortBy) queryParams.set('sort', sortBy)

        const url = `${baseUrl}/public/properties${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
        const res = await fetch(url).catch(() => null)
        if (res && res.ok && isSubscribed) {
          const data = await res.json().catch(() => [])
          // Keep demo listings only when the unfiltered DB is empty; a filtered empty result must clear stale cards
          const hasActiveFilters = Array.from(queryParams.keys()).some((k) => k !== 'sort')
          if (Array.isArray(data) && (data.length > 0 || hasActiveFilters)) {
            const mapped = data.map((item) => mapBackendProperty(item))
            setAllProperties(mapped)
          } else if (Array.isArray(data)) {
            setAllProperties(PROPERTIES)
          }
        }
      } catch (err) {
        console.error('Failed to load properties:', err)
      } finally {
        if (isSubscribed) {
          setIsLoading(false)
          if (pendingScrollRef.current) {
            pendingScrollRef.current = false
            // Re-align only if the new results pushed the grid out of place.
            requestAnimationFrame(() => {
              const top = document.getElementById('properties-grid')?.getBoundingClientRect().top
              if (top !== undefined && (top < 0 || top > 220)) scrollToSection('properties-grid', { delay: 0 })
            })
          }
        }
      }
    }

    const timer = setTimeout(loadProperties, 250)
    return () => {
      isSubscribed = false
      clearTimeout(timer)
    }
  }, [selectedCity, selectedType, selectedListingType, searchQuery, onlyVerified, sortBy])

  // Filtered Properties Computation
  const filteredProperties = React.useMemo(() => {
    return allProperties.filter((prop) => {
      // 1. City Filter
      if (selectedCity !== 'All Cities') {
        const propCity = (prop.location.city || '').toLowerCase()
        const targetCity = selectedCity.toLowerCase()
        if (!propCity.includes(targetCity) && !targetCity.includes(propCity)) return false
      }

      // 2. Property Type Filter
      if (selectedType !== 'ALL') {
        // selectedType is a backend enum (e.g. RESIDENTIAL_PLOT); prop.propertyType is the mapped display type
        const selectedDisplayType = mapPropertyType(selectedType.toUpperCase())
        if (prop.propertyType.toUpperCase() !== selectedType.toUpperCase() && prop.propertyType !== selectedDisplayType) return false
      }

      // 3. Listing Type Filter (Sale / Rent / Lease)
      if (selectedListingType !== 'ALL') {
        const pType = (prop.listingType || 'SALE').toUpperCase()
        const sType = selectedListingType.toUpperCase()
        const isSaleOrBuy = (pType === 'SALE' || pType === 'BUY') && (sType === 'SALE' || sType === 'BUY')
        const isRent = pType === 'RENT' && sType === 'RENT'
        const isLease = pType === 'LEASE' && sType === 'LEASE'
        if (!isSaleOrBuy && !isRent && !isLease) return false
      }

      // 4. Budget Range Filter
      if (selectedBudget !== 'ALL') {
        const budgetConfig = BUDGET_OPTIONS.find((b) => b.value === selectedBudget)
        if (budgetConfig) {
          if (prop.price < budgetConfig.min || prop.price > budgetConfig.max) return false
        }
      }

      // 5. Verified / RERA Only Filter
      if (onlyVerified) {
        const rera = prop.legalInfo?.reraNumber
        const titleType = prop.legalInfo?.titleType
        if (!rera && !titleType) return false
      }

      // 6. Keyword Search Filter (Title, Area, City, Address, Type, Features, Amenities, Desc)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = prop.title.toLowerCase().includes(q)
        const matchArea = (prop.location.area || '').toLowerCase().includes(q)
        const matchCity = (prop.location.city || '').toLowerCase().includes(q)
        const matchAddress = (prop.location.address || '').toLowerCase().includes(q)
        const matchType = prop.propertyType.toLowerCase().includes(q)
        const matchDesc = (prop.description || '').toLowerCase().includes(q)
        const matchFeatures = (prop.features || []).some((f: string) => f.toLowerCase().includes(q))
        const matchAmenities = (prop.amenities || []).some((a: { name: string }) => (a.name || '').toLowerCase().includes(q))

        if (!matchTitle && !matchArea && !matchCity && !matchAddress && !matchType && !matchDesc && !matchFeatures && !matchAmenities) {
          return false
        }
      }

      return true
    }).sort((a, b) => {
      if (sortBy === 'PRICE_LOW') return a.price - b.price
      if (sortBy === 'PRICE_HIGH') return b.price - a.price
      if (sortBy === 'NEWEST') return (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0)
      // FEATURED Default
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)
    })
  }, [allProperties, selectedCity, selectedType, selectedListingType, selectedBudget, onlyVerified, searchQuery, sortBy])

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCity('All Cities')
    setSelectedType('ALL')
    setSelectedListingType('ALL')
    setSelectedBudget('ALL')
    setOnlyVerified(false)
    setSortBy('FEATURED')
    setSearchNotice(null)

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname)
    }
    router.replace('/properties', { scroll: false })
  }

  return (
    <div className="min-h-screen bg-white space-y-0 pb-0 overflow-x-hidden max-w-full w-full">
      <div className="bg-gradient-to-r from-[#051711] via-[#0A2E23] to-[#0B4F3C] text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-emerald-500/20 shadow-xl relative overflow-hidden max-w-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />

        <div className="max-w-[1440px] mx-auto relative z-10 space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-extrabold uppercase tracking-widest border border-emerald-500/30 inline-flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Smart Dynamic Real Estate Finder
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-semibold text-white tracking-tight">
              Location-Wise Property Directory
            </h1>
            <p className="text-white/70 text-base max-w-2xl mx-auto font-normal">
              Search verified residential plots, commercial spaces, luxury villas, and showrooms by typing any city, locality, sector, or project name.
            </p>
            {/* Buy & Sell CTA Pills */}
            <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
              <Link
                href="/list-your-property"
                className="inline-flex items-center gap-2 px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-lg cursor-pointer border border-amber-300"
              >
                <Home className="w-4 h-4" />
                🏠 Sell / List Your Property — Free
              </Link>
              <a
                href="#properties-grid"
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-bold text-xs uppercase tracking-wider rounded-full transition-all border border-emerald-500/30 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                Browse &amp; Buy Properties ↓
              </a>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-2xl border border-emerald-500/20 max-w-5xl mx-auto text-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowLocationDropdown(true)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applySearchText(searchQuery)
                    } else if (e.key === 'Escape') {
                      setShowLocationDropdown(false)
                    }
                  }}
                  onFocus={() => setShowLocationDropdown(true)}
                  onBlur={() => setTimeout(() => setShowLocationDropdown(false), 150)}
                  enterKeyHint="search"
                  aria-label="Search by city, locality, landmark or project"
                  placeholder="City, locality, landmark, project..."
                  className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-900"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setShowLocationDropdown(false)
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleNearbyClick}
                    disabled={isLocating}
                    className={`p-1.5 rounded-full transition-all cursor-pointer border ${
                      isLocating
                        ? 'text-emerald-700 bg-emerald-100 animate-pulse border-emerald-500'
                        : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white border-emerald-200'
                    }`}
                    title="Properties near me"
                    aria-label="Search properties near my location"
                  >
                    {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    aria-label="Voice search"
                    className={`p-1.5 rounded-full transition-all cursor-pointer border ${
                      isListening 
                        ? 'text-red-500 bg-red-100 animate-pulse border-red-500' 
                        : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white border-emerald-200'
                    }`}
                    title="Voice Search"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Location Suggestions Popup */}
                {showLocationDropdown && locationSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {locationSuggestions.map((item, i) => {
                      const text = item.replace(/^(City|Locality|Area|Project):\s*/, '')
                      const cityImage = item.startsWith('City:') ? cityImageByName[text.toLowerCase()] : undefined
                      return (
                        <button
                          key={i}
                          type="button"
                          // mousedown fires before the input's blur closes the dropdown
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            if (item.startsWith('City:')) {
                              setSelectedCity(text)
                              setSearchQuery('')
                            } else {
                              setSearchQuery(text)
                            }
                            setShowLocationDropdown(false)
                            setSearchNotice(null)
                            scrollToResults(true)
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800 flex items-center gap-2 min-w-0">
                            {cityImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cityImage} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                            <span className="truncate">{text}</span>
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
                            {item.split(':')[0]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Dynamic City Picker */}
              <div>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value)
                    scrollToResults()
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  {availableCities.map((c) => (
                    <option key={c} value={c}>{c === 'All Cities' ? '📍 All Cities' : `📍 ${c}`}</option>
                  ))}
                </select>
              </div>

              {/* Property Type Dropdown */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value)
                    scrollToResults()
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  {PROPERTY_TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Budget Filter */}
              <div>
                <select
                  value={selectedBudget}
                  onChange={(e) => {
                    setSelectedBudget(e.target.value)
                    scrollToResults()
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  {BUDGET_OPTIONS.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Action Filter Pills */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full sm:w-auto min-w-0 pb-0.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0">Quick Filters:</span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1 shrink-0 whitespace-nowrap bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(e) => {
                      setOnlyVerified(e.target.checked)
                      scrollToResults()
                    }}
                    className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified / RERA Only
                </label>

                {['ALL', 'SALE', 'RENT', 'LEASE'].map((lType) => (
                  <button
                    key={lType}
                    type="button"
                    onClick={() => {
                      setSelectedListingType(lType)
                      scrollToResults()
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${selectedListingType === lType
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {lType === 'ALL' ? 'All Listings' : lType}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  {filteredProperties.length} {filteredProperties.length === 1 ? 'Property' : 'Properties'} Found
                </span>
                {(searchQuery || selectedCity !== 'All Cities' || selectedType !== 'ALL' || selectedListingType !== 'ALL' || selectedBudget !== 'ALL' || onlyVerified || sortBy !== 'FEATURED') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline px-2 py-1 cursor-pointer"
                  >
                    Reset All
                  </button>
                )}
              </div>
            </div>

            {(searchNotice || isListening) && (
              <div
                role="status"
                className={`mt-3 flex items-start justify-between gap-2 rounded-2xl px-3 py-2 text-xs font-semibold border ${
                  searchNotice?.tone === 'error' && !isListening
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                <span>{isListening ? '🎙️ Listening… say a city, locality or project name.' : searchNotice?.text}</span>
                {!isListening && (
                  <button type="button" onClick={() => setSearchNotice(null)} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-8">
        {cityCards.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" /> Cities with listings
            </h3>
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
              {cityCards.map(({ name, count }) => {
                const cityImage = cityImageByName[name.toLowerCase()] || getCityImage(name)
                return (
                  <Link
                    key={cityToSlug(name)}
                    href={cityPageHref(name)}
                    className="group relative h-40 rounded-2xl border border-brand-green/15 overflow-hidden shadow-sm hover:shadow-md hover:border-brand-green/40 transition-all flex flex-col justify-end w-[78%] shrink-0 snap-start sm:w-auto"
                  >
                    <div className="absolute inset-0 bg-gray-100">
                      {cityImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cityImage} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : null}
                    </div>
                    {cityImage ? <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" /> : null}
                    <div className="relative z-10 p-4 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`font-serif text-xl font-semibold ${cityImage ? 'text-white' : 'text-brand-charcoal'}`}>{name}</h4>
                        <ArrowRight className={`w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform ${cityImage ? 'text-white' : 'text-brand-green'}`} />
                      </div>
                      <p className={`text-sm ${cityImage ? 'text-white/80' : 'text-brand-charcoal/70'}`}>
                        {count} verified {count === 1 ? 'property' : 'properties'}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Callout Action Banners: Buy, Bulk Buy, Sell */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sell / List Your Property */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-200 shadow-md flex flex-col justify-between gap-3">
            <div>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-700 rounded-md text-[10px] font-extrabold uppercase tracking-wider border border-amber-300">
                🏠 FREE SELLER LISTING
              </span>
              <h4 className="font-serif text-base font-bold text-slate-900 mt-2">Sell Your Property</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                List your plot, villa, apartment, or commercial space. Reach lakhs of verified buyers — zero brokerage.
              </p>
            </div>
            <Link
              href="/list-your-property"
              className="w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-2xl cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <Home className="w-4 h-4" /> List Your Property — Free
            </Link>
          </div>

          {/* Bulk Buy */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-5 text-white border border-emerald-500/20 shadow-md flex flex-col justify-between gap-3">
            <div>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-md text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/30">
                HOT INVESTOR DEAL
              </span>
              <h4 className="font-serif text-base font-bold text-white mt-2">Bulk Buy Deals</h4>
              <p className="text-xs text-white/70 mt-0.5">
                Looking for multiple plots or high-ticket investor syndicates? Submit your bulk requirement.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsBulkBuyOpen(true)}
              className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-2xl cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-lg"
            >
              <Building2 className="w-4 h-4" /> Submit Bulk Inquiry
            </button>
          </div>

          {/* Browse Properties */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md flex flex-col justify-between gap-3">
            <div>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200">
                🔍 BROWSE &amp; BUY
              </span>
              <h4 className="font-serif text-base font-bold text-slate-900 mt-2">Find &amp; Buy Property</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Browse verified listings and click <strong>Buy Now</strong> on any property card to submit your purchase inquiry instantly.
              </p>
            </div>
            <a
              href="#properties-grid"
              className="w-full px-4 py-2.5 bg-[#0B4F3C] hover:bg-[#0a4434] text-white font-bold text-xs uppercase tracking-wider rounded-2xl cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <Layers className="w-4 h-4" /> Browse Properties Below ↓
            </a>
          </div>
        </div>

        {/* Directory Controls & Sorting Bar */}
        <div id="properties-grid" className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-bold text-slate-900">
              {selectedCity === 'All Cities' ? 'All Verified Properties' : `Properties in ${selectedCity}`}
            </h2>
            <span 
              className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 cursor-help transition-all hover:bg-emerald-100"
              title={`Showing ${filteredProperties.length} properties out of ${allProperties.length} total. \nFilters: City: ${selectedCity}, Type: ${selectedType}, Budget: ${selectedBudget}`}
            >
              {filteredProperties.length} Available
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Sort By Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="FEATURED">Featured First</option>
                <option value="NEWEST">Newest Listed</option>
                <option value="PRICE_LOW">Price: Low to High</option>
                <option value="PRICE_HIGH">Price: High to Low</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Directory Grid / List View */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl p-4 h-80 animate-pulse" />
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-gradient-to-br from-white via-[#FDFCF0] to-emerald-50/40 border border-emerald-500/20 rounded-3xl p-8 sm:p-12 text-center shadow-xl space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <MapPin className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="max-w-xl mx-auto space-y-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-emerald-200 inline-block">
                {selectedCity !== 'All Cities' ? `📍 Destination: ${selectedCity}` : 'Verified Property Finder'}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                {selectedCity !== 'All Cities'
                  ? `Upcoming Real Estate Projects in ${selectedCity}`
                  : 'No Matching Properties Found'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {selectedCity !== 'All Cities'
                  ? `House & Sky is actively registering verified NA plots, smart township parcels, and commercial spaces in ${selectedCity}. Be the first to inquire or list your property in ${selectedCity}.`
                  : 'No properties matched your exact filter combination. Try adjusting budget or resetting filters.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {selectedCity !== 'All Cities' && (
                <a
                  href={`https://wa.me/919311227789?text=${encodeURIComponent(`Hi House & Sky, I am looking for property inventory / plot options in ${selectedCity}. Please notify me when available.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-200" /> Inquire for {selectedCity}
                </a>
              )}
              <Link
                href="/list-your-property"
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-emerald-400" /> List Property in {selectedCity !== 'All Cities' ? selectedCity : 'Your City'}
              </Link>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
              >
                View All Cities
              </button>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredProperties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} variant={viewMode === 'grid' ? 'B' : 'A'} />
            ))}
          </div>
        )}
      </div>
      </div>

      <BulkBuyModal isOpen={isBulkBuyOpen} onClose={() => setIsBulkBuyOpen(false)} />
    </div>
  )
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="max-w-[1440px] mx-auto px-4 py-20 text-center text-xs font-mono">Loading property finder…</div>}>
      <PropertiesContent />
    </Suspense>
  )
}
