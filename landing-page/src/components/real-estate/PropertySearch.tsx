'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Navigation, ChevronDown, Mic, Loader2, X } from 'lucide-react'
import { DEFAULT_CITY_NAMES, getCityImage, matchCityName, useConfiguredCities } from '@/utils/cities'

interface PropertySearchProps {
  initialLocation?: string
  initialType?: string
  initialPriceRange?: string
  initialBedrooms?: string
  className?: string
  variant?: 'hero' | 'compact'
}

const TABS = ['Buy', 'Rent', 'New Launch', 'Commercial', 'Plots/Land', 'Projects']

export function PropertySearch({
  initialLocation = '',
  className = '',
  variant = 'hero',
}: PropertySearchProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState('Buy')
  const [searchQuery, setSearchQuery] = React.useState(initialLocation)
  const [propertyType, setPropertyType] = React.useState('All Residential')
  const [isLocating, setIsLocating] = React.useState(false)
  const [isListening, setIsListening] = React.useState(false)
  const [notice, setNotice] = React.useState('')
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const { cities: configuredCities } = useConfiguredCities()

  const cityNames = configuredCities.length > 0 ? configuredCities.map((c) => c.name) : DEFAULT_CITY_NAMES
  const popularCities = cityNames.slice(0, 6)
  const citySuggestions = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return []
    const list = configuredCities.length > 0
      ? configuredCities
          .filter((c) => c.name.toLowerCase().includes(q))
          .slice(0, 6)
          .map((c) => ({ ...c, imageUrl: c.imageUrl || getCityImage(c.name) || '' }))
      : DEFAULT_CITY_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, 6).map((name) => ({
          _id: name,
          name,
          state: '',
          imageUrl: getCityImage(name) || '',
        }))
    // Nothing to suggest once the text already is that city — and on phones the
    // open list would cover the Search button.
    if (list.length === 1 && list[0].name.toLowerCase() === q) return []
    return list
  }, [searchQuery, configuredCities])

  const handleVoiceSearch = () => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setNotice('Voice search is not supported in this browser. Try Chrome, Edge or Safari.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    
    recognition.onresult = (event: any) => {
      const transcript = (event.results?.[0]?.[0]?.transcript || '').trim()
      if (!transcript) return
      setSearchQuery(transcript)
      submitSearch(transcript)
    }

    recognition.onerror = (event: any) => {
      setIsListening(false)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setNotice('Microphone permission was denied. Allow microphone access to use voice search.')
      } else if (event.error === 'no-speech') {
        setNotice('Didn’t catch that — tap the mic and say a city or locality.')
      } else if (event.error !== 'aborted') {
        setNotice('Voice search failed. Please try again or type your search.')
      }
    }

    recognition.onend = () => setIsListening(false)

    try {
      setNotice('')
      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  const handleNearbyClick = () => {
    if (!('geolocation' in navigator)) {
      setNotice('Location is not supported in this browser. Please type a city instead.')
      return
    }

    setNotice('')
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const { latitude, longitude } = position.coords
        
        const params = new URLSearchParams()
        params.set('intent', activeTab.toLowerCase())
        if (propertyType !== 'All Residential') {
          params.set('type', propertyType)
        }
        params.set('lat', latitude.toString())
        params.set('lng', longitude.toString())
        params.set('nearby', 'true')
        
        router.push(`/properties?${params.toString()}#properties-grid`)
      },
      (error) => {
        setIsLocating(false)
        setNotice(error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Allow location access in your browser, or type a city instead.'
          : 'Could not get your location. Please try again or type a city instead.')
      },
      { timeout: 15000, maximumAge: 5 * 60 * 1000 }
    )
  }

  const submitSearch = (query: string = searchQuery) => {
    setShowSuggestions(false)
    const params = new URLSearchParams()
    const trimmed = query.trim()
    // A spoken/typed city name goes to the city filter; anything else is a keyword search.
    const city = matchCityName(trimmed, cityNames)
    if (city) params.set('city', city)
    else if (trimmed) params.set('location', trimmed)
    params.set('intent', activeTab.toLowerCase())
    if (propertyType !== 'All Residential') {
      params.set('type', propertyType)
    }
    router.push(`/properties?${params.toString()}#properties-grid`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    submitSearch()
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-xl w-full ${
        variant === 'hero' ? 'max-w-5xl mx-auto' : ''
      } ${className}`}
    >
      {/* ── Tabs Row ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-200 px-4 sm:px-6 pt-3">
        <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab
            const isNewLaunch = tab === 'New Launch'
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative py-3 sm:py-0 sm:pb-3 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 min-h-[44px] sm:min-h-0 ${
                  isActive ? 'text-brand-charcoal' : 'text-gray-500 hover:text-brand-charcoal'
                }`}
              >
                {tab}
                {isNewLaunch && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute -top-0.5 -right-2" />
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>
        <div className="hidden md:block pb-3">
          <Link href="/list-your-property" className="text-sm font-semibold text-gray-700 hover:text-brand-charcoal flex items-center gap-1 cursor-pointer py-3 sm:py-0 min-h-[44px] sm:min-h-0">
            Post Property
            <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ml-1">
              Free
            </span>
          </Link>
        </div>
      </div>

      {/* ── Search Bar Row ─────────────────────────────────────────────────── */}
      <div className="p-3 sm:p-4">
        <form
          onSubmit={handleSearch}
          noValidate
          className="flex flex-col sm:flex-row items-center bg-gray-50/80 border border-gray-200 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-brand-green/20 focus-within:border-brand-green transition-all"
        >
          {/* Dropdown */}
          <div className="relative flex items-center gap-1 px-4 py-2 border-b sm:border-b-0 sm:border-r border-gray-300 w-full sm:w-auto shrink-0">
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="appearance-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none pr-5 w-full cursor-pointer min-h-[44px] sm:min-h-0"
            >
              <option>All Residential</option>
              <option>Apartments</option>
              <option>Villas</option>
              <option>Plots</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative flex-grow flex items-center gap-2 px-4 py-2 w-full">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder={`Search "${cityNames[0] || 'Dholera'}"`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowSuggestions(false)
              }}
              enterKeyHint="search"
              aria-label="Search by city, locality or project"
              className="w-full bg-transparent text-sm text-brand-charcoal focus:outline-none font-medium placeholder-gray-400 min-h-[44px] sm:min-h-0"
            />
            {showSuggestions && citySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-gray-100">
                {citySuggestions.map((city) => (
                  <button
                    key={city._id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setSearchQuery(city.name)
                      submitSearch(city.name)
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-brand-soft text-sm flex items-center gap-3 cursor-pointer"
                  >
                    {city.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={city.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    ) : (
                      <MapPin className="w-4 h-4 text-brand-green shrink-0" />
                    )}
                    <span className="font-semibold text-brand-charcoal truncate">{city.name}</span>
                    {city.state && <span className="text-xs text-gray-400 truncate">{city.state}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Icons & Button */}
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 px-2 py-1 w-full sm:w-auto shrink-0 mt-2 sm:mt-0 border-t sm:border-t-0 border-gray-100 sm:border-none pt-2 sm:pt-0">
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`p-3 sm:p-2 rounded-full transition-all cursor-pointer min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center border ${
                isListening 
                  ? 'text-red-500 bg-red-100 animate-pulse border-red-500' 
                  : 'text-brand-green bg-brand-soft hover:bg-brand-green hover:text-white border-brand-green/30 shadow-sm'
              }`}
              title="Voice Search"
              aria-label="Voice search"
            >
              <Mic className="w-4 h-4 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={handleNearbyClick}
              className={`p-3 sm:p-2 rounded-full transition-all cursor-pointer min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center border ${
                isLocating 
                  ? 'text-brand-green bg-brand-green/20 animate-pulse border-brand-green' 
                  : 'text-brand-green bg-brand-soft hover:bg-brand-green hover:text-white border-brand-green/30 shadow-sm'
              }`}
              title="Properties near me"
              aria-label="Search properties near my location"
              disabled={isLocating}
            >
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 sm:w-4 sm:h-4" />}
            </button>
            <button
              type="submit"
              className="hs-btn-primary ml-1 px-6 min-h-[44px] sm:min-h-0 flex-1 sm:flex-none"
            >
              Search
            </button>
          </div>
        </form>

        {(notice || isListening) && (
          <div role="status" className={`mt-3 mx-1 flex items-start justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold border ${isListening ? 'bg-brand-soft text-brand-green border-brand-green/20' : 'bg-red-50 text-red-700 border-red-200'}`}>
            <span>{isListening ? '🎙️ Listening… say a city, locality or project name.' : notice}</span>
            {!isListening && (
              <button type="button" onClick={() => setNotice('')} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* ── Popular cities (from admin panel → Cities & Locations) ───────── */}
        <div className="flex items-center gap-2 px-1 mt-3 sm:mt-4 text-[11px] text-gray-500 font-medium overflow-x-auto scrollbar-none">
          <span className="shrink-0">Popular:</span>
          {popularCities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                setSearchQuery(city)
                submitSearch(city)
              }}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-brand-soft hover:text-brand-green cursor-pointer whitespace-nowrap"
            >
              <MapPin className="w-3 h-3" />
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
