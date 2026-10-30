'use client'

import * as React from 'react'
import Image from 'next/image'
import { SectionHeading } from '@/components/real-estate/SectionHeading'
import { getApiBaseUrl } from '@/utils/api'
import { DraftNotice } from '@/components/ui/DraftNotice'
import { mergeDraft, usePersistDraft } from '@/utils/useFormDraft'
import { scrollToSection } from '@/utils/scroll'
import { FALLBACK_IMAGE, SITE } from '@/utils/siteConfig'
import {
  Flame,
  Percent,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  PhoneCall,
  MessageCircle,
  X,
  ArrowRight,
  Sparkles,
  Send,
  Building2,
  Layers,
  Award,
  Search,
  Filter
} from 'lucide-react'

interface PublicBulkDeal {
  _id: string
  title: string
  slug: string
  dealType: 'PROJECT' | 'PROPERTY' | 'PACKAGE'
  location: string
  city: string
  state: string
  surveyNumber?: string
  finalPlotNo?: string
  areaSize?: string
  roadWidth?: string
  tpSectorVillage?: string
  landPlotType?: string
  isCorner?: string
  unitType?: string
  zone?: string
  naStatus?: string
  conditionTime?: string
  ratePerUnit?: string
  originalPriceDisplay: string
  bulkPriceDisplay: string
  discountPercentage: number
  minQuantity: string
  totalPackageUnits: string
  perks: string[]
  bannerImage: string
  description: string
  isAvailable: boolean
  isFeatured: boolean
  projectId?: {
    _id: string
    name: string
    code: string
    bannerImage?: string
  }
}

export default function BulkDealsPage() {
  const [deals, setDeals] = React.useState<PublicBulkDeal[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedFilter, setSelectedFilter] = React.useState('ALL')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCity, setSelectedCity] = React.useState('ALL')
  const [minDiscount, setMinDiscount] = React.useState(0)
  const [viewingSpecDeal, setViewingSpecDeal] = React.useState<PublicBulkDeal | null>(null)

  const [dbCities, setDbCities] = React.useState<string[]>([])
  const [dbLocations, setDbLocations] = React.useState<string[]>([])
  const [showLocationDropdown, setShowLocationDropdown] = React.useState(false)

  // Modal Quote Request State
  const [selectedDeal, setSelectedDeal] = React.useState<PublicBulkDeal | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  const [requestForm, setRequestForm] = React.useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    unitCount: '5',
    budgetRange: '₹50 Lakhs - ₹1 Crore',
    message: ''
  })
  const [requestBaseline, setRequestBaseline] = React.useState(requestForm)
  const [requestDraftRestored, setRequestDraftRestored] = React.useState(false)
  const requestKey = selectedDeal?._id ? `hs-public-bulk-request-${selectedDeal._id}` : 'hs-public-bulk-request-none'
  const clearRequestDraft = usePersistDraft(requestKey, requestForm, requestBaseline, Boolean(selectedDeal))

  // Fetch unique bulk deal location options from backend API
  React.useEffect(() => {
    const fetchLocations = async () => {
      try {
        const baseUrl = getApiBaseUrl()
        const res = await fetch(`${baseUrl}/public/bulk-deals/locations`).catch(() => null)
        if (res && res.ok) {
          const data = await res.json().catch(() => ({}))
          if (Array.isArray(data.cities)) setDbCities(data.cities)
          if (Array.isArray(data.locations)) setDbLocations(data.locations)
        }
      } catch (e) {
        console.error('Failed to fetch DB bulk deal locations:', e)
      }
    }
    fetchLocations()
  }, [])

  // Dynamically computed list of cities from DB API + loaded bulk deals
  const availableCities = React.useMemo(() => {
    const set = new Set<string>(dbCities)
    deals.forEach((d) => {
      if (d.city && d.city.trim()) set.add(d.city.trim())
    })
    return ['ALL', ...Array.from(set).sort()]
  }, [dbCities, deals])

  // Autocomplete Location Suggestions matching user searchQuery
  const locationSuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    const pool = new Set<string>()

    dbCities.forEach((c) => {
      if (c.toLowerCase().includes(q)) pool.add(`City: ${c}`)
    })
    dbLocations.forEach((loc) => {
      if (loc.toLowerCase().includes(q)) pool.add(`Location: ${loc}`)
    })
    deals.forEach((d) => {
      if (d.tpSectorVillage && d.tpSectorVillage.toLowerCase().includes(q)) pool.add(`TP/Sector: ${d.tpSectorVillage}`)
      if (d.surveyNumber && d.surveyNumber.toLowerCase().includes(q)) pool.add(`Survey: ${d.surveyNumber}`)
    })

    return Array.from(pool).slice(0, 8)
  }, [searchQuery, dbCities, dbLocations, deals])

  React.useEffect(() => {
    const loadDeals = async () => {
      try {
        setIsLoading(true)
        const baseUrl = getApiBaseUrl()
        const queryParams = new URLSearchParams()
        if (selectedFilter !== 'ALL') queryParams.set('dealType', selectedFilter)
        if (selectedCity !== 'ALL') queryParams.set('city', selectedCity)
        if (searchQuery.trim()) queryParams.set('search', searchQuery.trim())
        if (minDiscount > 0) queryParams.set('minDiscount', String(minDiscount))

        const url = `${baseUrl}/public/bulk-deals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
        const res = await fetch(url).catch(() => null)
        if (res && res.ok) {
          const data = await res.json().catch(() => [])
          setDeals(Array.isArray(data) ? data : [])
        }
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(loadDeals, 200)
    return () => clearTimeout(timer)
  }, [selectedFilter, selectedCity, searchQuery, minDiscount])

  const filteredDeals = React.useMemo(() => {
    return deals.filter((d) => {
      if (selectedFilter !== 'ALL' && d.dealType !== selectedFilter) return false
      if (selectedCity !== 'ALL') {
        const c = (d.city || '').toLowerCase()
        const target = selectedCity.toLowerCase()
        if (!c.includes(target) && !target.includes(c)) return false
      }
      if (minDiscount > 0 && (d.discountPercentage || 0) < minDiscount) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = d.title.toLowerCase().includes(q)
        const matchCity = (d.city || '').toLowerCase().includes(q)
        const matchLoc = (d.location || '').toLowerCase().includes(q)
        const matchState = (d.state || '').toLowerCase().includes(q)
        const matchSurvey = (d.surveyNumber || '').toLowerCase().includes(q)
        const matchPlot = (d.finalPlotNo || '').toLowerCase().includes(q)
        const matchTp = (d.tpSectorVillage || '').toLowerCase().includes(q)
        const matchDesc = (d.description || '').toLowerCase().includes(q)
        if (!matchTitle && !matchCity && !matchLoc && !matchState && !matchSurvey && !matchPlot && !matchTp && !matchDesc) return false
      }
      return true
    })
  }, [deals, selectedFilter, selectedCity, minDiscount, searchQuery])

  const handleOpenModal = (deal: PublicBulkDeal) => {
    setSelectedDeal(deal)
    setIsSubmitted(false)
    const base = {
      name: '',
      phone: '',
      email: '',
      city: deal.city || '',
      state: deal.state || '',
      unitCount: deal.minQuantity ? deal.minQuantity.split(' ')[0] : '5',
      budgetRange: '₹50 Lakhs - ₹1 Crore',
      message: ''
    }
    const saved = mergeDraft(`hs-public-bulk-request-${deal._id}`, base)
    setRequestBaseline(base)
    setRequestForm(saved.value)
    setRequestDraftRestored(saved.restored)
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestForm.name || !requestForm.phone) {
      alert('Please enter your name and phone number')
      return
    }

    try {
      setIsSubmitting(true)
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/public/bulk-deals/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestForm,
          bulkDealId: selectedDeal?._id,
          dealTitle: selectedDeal?.title,
          city: requestForm.city || selectedDeal?.city || '',
          state: requestForm.state || selectedDeal?.state || ''
        })
      })

      if (res.ok) {
        clearRequestDraft()
        setRequestDraftRestored(false)
        setIsSubmitted(true)
      } else {
        alert('Failed to submit request. Please try again or call our bulk deal desk directly.')
      }
    } catch (err) {
      console.error(err)
      alert('Error submitting request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const whatsappLink = selectedDeal
    ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
        `Hi House & Sky Desk, I am interested in the Bulk Deal Package: "${selectedDeal.title}" (${selectedDeal.minQuantity}). Please share inventory chart and wholesale quote.`
      )}`
    : `https://wa.me/${SITE.whatsapp}`

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-20 pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-950/40 via-neutral-950 to-neutral-950 border-b border-white/10 py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-amber-400" /> Exclusive Wholesale & Syndicate Deals
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif font-semibold text-white tracking-tight leading-tight">
              Institutional & Bulk Investor Packages
            </h1>

            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              Lock wholesale land rates, group syndicate packages, and direct builder pricing for high-yielding growth corridors.
            </p>

            {/* Key Value Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-2.5">
                <Percent className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">15% - 35% OFF</span>
                  <span className="text-[10px] text-neutral-400">Below Retail Rates</span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">NA Clear Title</span>
                  <span className="text-[10px] text-neutral-400">100% Legal Verified</span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">0% Brokerage</span>
                  <span className="text-[10px] text-neutral-400">Direct Developer Deal</span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Free Site Visit</span>
                  <span className="text-[10px] text-neutral-400">Flight / Cab VIP Access</span>
                </div>
              </div>
            </div>

            {/* Smart Location & Parameter Search Bar */}
            <div className="mt-8 bg-neutral-900/90 border border-emerald-500/30 rounded-3xl p-4 shadow-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Keyword & Location Search Input with Autocomplete */}
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowLocationDropdown(true)
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    onBlur={() => setTimeout(() => setShowLocationDropdown(false), 150)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setShowLocationDropdown(false)
                        scrollToSection('bulk-deals-results', { blur: true })
                      } else if (e.key === 'Escape') {
                        setShowLocationDropdown(false)
                      }
                    }}
                    enterKeyHint="search"
                    placeholder="City, TP Sector, Survey No, Project..."
                    className="w-full pl-10 pr-8 py-2.5 bg-neutral-950 border border-white/10 rounded-2xl text-xs font-semibold text-white focus:outline-none focus:border-amber-400 placeholder-neutral-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setShowLocationDropdown(false)
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Location Suggestions Popup */}
                  {showLocationDropdown && locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-white/5">
                      {locationSuggestions.map((item, i) => {
                        const text = item.replace(/^(City|Location|TP\/Sector|Survey):\s*/, '')
                        return (
                          <button
                            key={i}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              if (item.startsWith('City:')) {
                                setSelectedCity(text)
                                setSearchQuery('')
                              } else {
                                setSearchQuery(text)
                              }
                              setShowLocationDropdown(false)
                              scrollToSection('bulk-deals-results', { blur: true })
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-neutral-800 text-xs flex items-center justify-between transition-colors cursor-pointer text-white"
                          >
                            <span className="font-semibold text-neutral-200 flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              {text}
                            </span>
                            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded-full border border-amber-400/20">
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
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {availableCities.map((c) => (
                      <option key={c} value={c} className="bg-neutral-900 text-white">
                        {c === 'ALL' ? '📍 All Cities' : `📍 ${c}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minimum Discount Filter */}
                <div>
                  <select
                    value={minDiscount}
                    onChange={(e) => setMinDiscount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value={0} className="bg-neutral-900 text-white">🔥 Any Discount Rate</option>
                    <option value={15} className="bg-neutral-900 text-white">🔥 15%+ OFF Below Retail</option>
                    <option value={25} className="bg-neutral-900 text-white">🔥 25%+ OFF Wholesale Special</option>
                    <option value={30} className="bg-neutral-900 text-white">🔥 30%+ OFF Mega Syndicate</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Locations:</span>
                  {availableCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSelectedCity(city)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        selectedCity === city
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {city === 'ALL' ? 'All Locations' : city}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => scrollToSection('bulk-deals-results')}
                    className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                    title="Jump to deals"
                  >
                    {filteredDeals.length} Wholesale {filteredDeals.length === 1 ? 'Deal' : 'Deals'} ↓
                  </button>
                  {(searchQuery || selectedCity !== 'ALL' || minDiscount > 0 || selectedFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedCity('ALL')
                        setMinDiscount(0)
                        setSelectedFilter('ALL')
                      }}
                      className="text-xs font-bold text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      Reset All
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div id="bulk-deals-results" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Category Filter Tabs */}
        {!isLoading && deals.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { label: 'All Deals', value: 'ALL' },
              { label: 'Project Bundles', value: 'PROJECT' },
              { label: 'Property Deals', value: 'PROPERTY' },
              { label: 'Custom Syndicates', value: 'PACKAGE' }
            ].map((tab) => {
              const isActive = selectedFilter === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => setSelectedFilter(tab.value)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-neutral-900 border border-white/10 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] bg-neutral-900 animate-pulse rounded-3xl border border-white/10" />
            ))}
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-16 text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flame className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Bulk Deals Available</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto mb-6">
              There are currently no active bulk deal packages under this category. Contact our bulk deals desk directly to build a custom investor package.
            </p>
            <a
              href={`tel:${SITE.phoneTel}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-400 transition-colors"
            >
              <PhoneCall className="w-4 h-4" /> Call Bulk Deals Desk
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.map((deal) => {
              const bgImg =
                deal.bannerImage ||
                deal.projectId?.bannerImage ||
                FALLBACK_IMAGE

              return (
                <div
                  key={deal._id}
                  className="group relative bg-neutral-900 rounded-3xl overflow-hidden border border-white/10 hover:border-amber-500/50 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Image Header */}
                    <div className="relative aspect-[16/10] bg-neutral-950 overflow-hidden">
                      <Image
                        src={bgImg}
                        alt={deal.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/30 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                        <span className="px-3 py-1 bg-amber-500 text-slate-950 text-xs font-extrabold rounded-xl uppercase tracking-wider shadow-lg flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-slate-950" /> {deal.discountPercentage}% OFF
                        </span>
                        <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold rounded-lg border border-white/20 uppercase tracking-wider">
                          {deal.dealType}
                        </span>
                      </div>

                      {/* Location Pill */}
                      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-neutral-200 text-xs font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {deal.city || 'Dholera'}, {deal.state || 'Gujarat'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors leading-snug">
                          {deal.title}
                        </h3>
                        {deal.description && (
                          <p className="text-xs text-neutral-400 line-clamp-2 mt-1.5 leading-relaxed">
                            {deal.description}
                          </p>
                        )}
                      </div>

                      {/* HOUSE & SKY LAND SPECIFICATIONS SHEET TABLE */}
                      <div className="bg-gradient-to-b from-[#0A2E23] to-[#051813] border border-amber-500/30 rounded-2xl p-3 space-y-2">
                        <div className="flex items-center justify-between border-b border-amber-400/20 pb-1.5 gap-2">
                          <span className="text-[11px] font-serif font-bold text-amber-300 flex items-center gap-1 truncate">
                            <Layers className="w-3.5 h-3.5 shrink-0" /> My Property Details Spec
                          </span>
                          <button
                            type="button"
                            onClick={() => setViewingSpecDeal(deal)}
                            className="text-[9.5px] text-emerald-300 font-bold hover:underline shrink-0"
                          >
                            Full Sheet →
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[10.5px] sm:text-[11px]">
                          <div className="bg-black/40 px-2 py-1 rounded-lg border border-white/5 flex items-center justify-between gap-1">
                            <span className="text-neutral-400 shrink-0">Survey No:</span>
                            <span className="font-bold text-white truncate text-right">{deal.surveyNumber || '427'}</span>
                          </div>
                          <div className="bg-black/40 px-2 py-1 rounded-lg border border-white/5 flex items-center justify-between gap-1">
                            <span className="text-neutral-400 shrink-0">Old FP No:</span>
                            <span className="font-bold text-white truncate text-right">{deal.finalPlotNo || '521/1/1'}</span>
                          </div>
                          <div className="bg-black/40 px-2 py-1 rounded-lg border border-white/5 flex items-center justify-between gap-1">
                            <span className="text-neutral-400 shrink-0">Area:</span>
                            <span className="font-bold text-white truncate text-right">{deal.areaSize || '6100 SQYD'}</span>
                          </div>
                          <div className="bg-black/40 px-2 py-1 rounded-lg border border-white/5 flex items-center justify-between gap-1">
                            <span className="text-neutral-400 shrink-0">Road:</span>
                            <span className="font-bold text-white truncate text-right">{deal.roadWidth || '70 MTR'}</span>
                          </div>
                          <div className="bg-black/40 px-2 py-1 rounded-lg border border-white/5 flex items-center justify-between gap-1 col-span-2">
                            <span className="text-neutral-400 shrink-0">TP / Sector:</span>
                            <span className="font-bold text-white truncate text-right">{deal.tpSectorVillage || '3C / Sector-12 / Rampura'}</span>
                          </div>
                          <div className="bg-black/40 px-2 py-1 rounded-lg border border-white/5 flex items-center justify-between gap-1">
                            <span className="text-neutral-400 shrink-0">Corner:</span>
                            <span className="font-bold text-amber-300 truncate text-right">{deal.isCorner || 'Corner'}</span>
                          </div>
                          <div className="bg-black/40 px-2 py-1 rounded-lg border border-white/5 flex items-center justify-between gap-1">
                            <span className="text-neutral-400 shrink-0">NA Status:</span>
                            <span className="font-bold text-emerald-400 truncate text-right">{deal.naStatus || 'READY'}</span>
                          </div>
                        </div>

                        {/* Rate Highlight Bar */}
                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-2 px-3 text-slate-950 flex flex-wrap items-center justify-between gap-1.5 font-extrabold text-xs">
                          <span className="truncate">{deal.areaSize || '6100 SQYD'}</span>
                          <span className="text-xs sm:text-sm font-black whitespace-nowrap">RATE: ₹{Number(deal.ratePerUnit || 18000).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Pricing Comparison */}
                      <div className="bg-neutral-950 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Original Price</span>
                          <span className="text-xs text-neutral-400 line-through font-bold truncate block">
                            {deal.originalPriceDisplay || 'N/A'}
                          </span>
                        </div>
                        <div className="text-right min-w-0">
                          <span className="text-[10px] text-amber-400 font-bold uppercase block whitespace-nowrap">🔥 Special Bulk Rate</span>
                          <span className="text-xs sm:text-base text-amber-400 font-extrabold truncate block">
                            {deal.bulkPriceDisplay || 'Special Quote'}
                          </span>
                        </div>
                      </div>

                      {/* Perks */}
                      {deal.perks && deal.perks.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Package Benefits</span>
                          <div className="space-y-1">
                            {deal.perks.slice(0, 3).map((perk, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="truncate">{perk}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="p-5 pt-0">
                    <button
                      onClick={() => handleOpenModal(deal)}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group/btn cursor-pointer"
                    >
                      <span>Request Bulk Deal Quote</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FULL SPEC SHEET MODAL PREVIEW */}
      {viewingSpecDeal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setViewingSpecDeal(null)}
        >
          <div
            className="relative max-w-lg w-full bg-gradient-to-b from-[#0B2C22] to-[#04140F] rounded-3xl overflow-hidden border-2 border-amber-400/60 shadow-2xl p-6 my-auto text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-400/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-serif font-bold text-base border border-amber-400/40">
                  H&S
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">House & Sky</h3>
                  <span className="text-[10px] text-amber-300 uppercase tracking-widest font-bold block">BUILDING TRUST. DELIVERING VALUE.</span>
                </div>
              </div>
              <button
                onClick={() => setViewingSpecDeal(null)}
                className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-2">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-1.5 border-b border-white/10 pb-2">
                <Layers className="w-4 h-4" /> My Property Details Sheet
              </h4>

              <div className="space-y-1.5 text-xs pt-1">
                {[
                  { label: 'Survey No', value: viewingSpecDeal.surveyNumber || '427' },
                  { label: 'Old FP No', value: viewingSpecDeal.finalPlotNo || '521/1/1' },
                  { label: 'Area', value: viewingSpecDeal.areaSize || '6100 SQYD' },
                  { label: 'Road Width', value: viewingSpecDeal.roadWidth || '70 MTR' },
                  { label: 'TP / Sector / Village', value: viewingSpecDeal.tpSectorVillage || '3C / Sector-12 / Rampura' },
                  { label: 'City', value: viewingSpecDeal.city || 'Dholera City' },
                  { label: 'State', value: viewingSpecDeal.state || 'Gujarat' },
                  { label: 'Land / Plot', value: viewingSpecDeal.landPlotType || 'Land' },
                  { label: 'Corner Status', value: viewingSpecDeal.isCorner || 'Corner' },
                  { label: 'SQYD / SQMT', value: viewingSpecDeal.unitType || 'SQYD' },
                  { label: 'Zone', value: viewingSpecDeal.zone || 'HAC' },
                  { label: 'NA Status', value: viewingSpecDeal.naStatus || 'READY' },
                  { label: 'Condition / Timeline', value: viewingSpecDeal.conditionTime || '3 MONTHS' },
                  { label: 'Rate per Unit', value: viewingSpecDeal.ratePerUnit ? `₹${Number(viewingSpecDeal.ratePerUnit).toLocaleString('en-IN')}` : '₹18,000' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="text-neutral-400 font-medium">{item.label}</span>
                    <span className="font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Total Banner */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-2xl p-4 text-slate-950 flex items-center justify-between font-extrabold shadow-xl">
              <div>
                <span className="text-2xl font-black block leading-none">{viewingSpecDeal.areaSize || '6100 SQYD'}</span>
                <span className="text-[10px] tracking-wider uppercase opacity-80 font-bold">TOTAL AREA</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] tracking-wider uppercase opacity-80 font-bold block">BULK RATE</span>
                <span className="text-xl font-black">₹{Number(viewingSpecDeal.ratePerUnit || 18000).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => { setViewingSpecDeal(null); handleOpenModal(viewingSpecDeal); }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Request Quote For This Property
            </button>
          </div>
        </div>
      )}


      {/* REQUEST QUOTE MODAL */}
      {selectedDeal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setSelectedDeal(null)}
        >
          <div
            className="relative max-w-xl w-full bg-neutral-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-neutral-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    BULK INVESTOR INQUIRY
                  </span>
                  <h3 className="text-white text-base font-bold truncate max-w-xs">{selectedDeal.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeal(null)}
                className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {isSubmitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Quote Request Received!</h3>
                  <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong className="text-white">{requestForm.name}</strong>. Our Head of Bulk Deal Acquisitions will reach out to you within 2 business hours with official inventory charts and pricing breakdown.
                  </p>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" /> Chat on WhatsApp Now
                    </a>
                    <button
                      onClick={() => setSelectedDeal(null)}
                      className="w-full sm:w-auto px-5 py-3 bg-neutral-800 text-neutral-300 font-bold text-xs rounded-xl hover:bg-neutral-700 transition-colors"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  {requestDraftRestored && (
                    <DraftNotice onDiscard={() => {
                      clearRequestDraft()
                      setRequestForm(requestBaseline)
                      setRequestDraftRestored(false)
                    }} />
                  )}
                  {/* Deal summary mini pill */}
                  <div className="bg-neutral-950 p-3 rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Target Rate</span>
                      <span className="font-bold text-amber-400">{selectedDeal.bulkPriceDisplay || 'Wholesale'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block">Min Package</span>
                      <span className="font-bold text-white">{selectedDeal.minQuantity}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={requestForm.name}
                      onChange={(e) => setRequestForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 9876543210"
                        value={requestForm.phone}
                        onChange={(e) => setRequestForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="investor@domain.com"
                        value={requestForm.email}
                        onChange={(e) => setRequestForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                        Preferred City
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dholera / Noida"
                        value={requestForm.city}
                        onChange={(e) => setRequestForm((prev) => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Gujarat / Uttar Pradesh"
                        value={requestForm.state}
                        onChange={(e) => setRequestForm((prev) => ({ ...prev, state: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                        Target Quantity / Plots
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5 Plots / 2500 SQYD"
                        value={requestForm.unitCount}
                        onChange={(e) => setRequestForm((prev) => ({ ...prev, unitCount: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                        Investment Budget Range
                      </label>
                      <select
                        value={requestForm.budgetRange}
                        onChange={(e) => setRequestForm((prev) => ({ ...prev, budgetRange: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                      >
                        <option value="₹25 Lakhs - ₹50 Lakhs">₹25 Lakhs - ₹50 Lakhs</option>
                        <option value="₹50 Lakhs - ₹1 Crore">₹50 Lakhs - ₹1 Crore</option>
                        <option value="₹1 Crore - ₹3 Crores">₹1 Crore - ₹3 Crores</option>
                        <option value="₹3 Crores+">₹3 Crores+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                      Custom Remarks / Requirements
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Looking for contiguous corner plots with immediate registry..."
                      value={requestForm.message}
                      onChange={(e) => setRequestForm((prev) => ({ ...prev, message: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDeal(null)}
                      className="px-4 py-2.5 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
