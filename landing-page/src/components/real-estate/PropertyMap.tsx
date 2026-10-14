'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Property } from '@/data/properties'
import { MapPin, Navigation, School, Utensils, Hospital, Plane, ArrowRight } from 'lucide-react'

interface PropertyMapProps {
  properties?: Property[]
  activeProperty?: Property
  className?: string
}

export function PropertyMap({
  properties = [],
  activeProperty,
  className = '',
}: PropertyMapProps) {
  const [selectedCity, setSelectedCity] = React.useState<string>('All')
  const [selectedProp, setSelectedProp] = React.useState<Property | null>(activeProperty || properties[0] || null)

  const cityTabs = ['All', 'Mumbai', 'Goa', 'Delhi NCR', 'Bangalore', 'Hyderabad', 'Pune']

  const filteredProperties = React.useMemo(() => {
    if (activeProperty) return [activeProperty]
    if (selectedCity === 'All') return properties
    return properties.filter((p) =>
      p.location.city.toLowerCase().includes(selectedCity.toLowerCase()) ||
      (selectedCity === 'Delhi NCR' && p.location.city.toLowerCase().includes('delhi'))
    )
  }, [properties, activeProperty, selectedCity])

  React.useEffect(() => {
    if (filteredProperties.length > 0 && (!selectedProp || !filteredProperties.find((p) => p.id === selectedProp.id))) {
      setSelectedProp(filteredProperties[0])
    }
  }, [filteredProperties, selectedProp])

  const proximityList = [
    { label: 'Airport Transit', dist: '18 min', icon: Plane },
    { label: 'Boutique Dining', dist: '5 min', icon: Utensils },
    { label: 'International School', dist: '8 min', icon: School },
    { label: 'Medical Center', dist: '12 min', icon: Hospital },
  ]

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Editorial Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-brand-green/10">
        <div className="space-y-2.5 max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-green block">
            EXPLORE THE NEIGHBOURHOOD
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-brand-charcoal font-normal leading-tight">
            Find a home in the right place.
          </h2>
          <p className="text-xs sm:text-sm text-brand-charcoal/70 font-light leading-relaxed">
            Explore exceptional properties alongside the neighbourhoods, landmarks, and connections that matter.
          </p>
        </div>

        {/* City Filter Tabs */}
        {!activeProperty && (
          <div className="flex flex-wrap items-center gap-1.5 bg-brand-soft p-1.5 rounded-md border border-brand-green/15">
            {cityTabs.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedCity === city
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'text-brand-charcoal/70 hover:text-brand-green hover:bg-white/60'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Split Layout: Editorial Quiet Map Canvas + House & Sky Preview Card */}
      <div className="bg-white border border-brand-green/15 rounded-lg flex flex-col lg:flex-row overflow-hidden shadow-sm">
        {/* Left Map Interactive Canvas */}
        <div className="relative w-full lg:w-2/3 h-[420px] sm:h-[500px] bg-[#FDFCF0] flex items-center justify-center p-6 overflow-hidden">
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#0B4F3C_1px,transparent_1px)] [background-size:28px_28px] opacity-10" />

          {/* Sky Blue Coastline & Road Vector Pathways */}
          <svg className="absolute inset-0 w-full h-full opacity-30 stroke-brand-green" fill="none">
            <path d="M-50 80 Q 250 450 650 180 T 1300 550" stroke="#C9A96E" strokeWidth="3" strokeDasharray="6 6" />
            <path d="M150 -50 Q 450 350 850 120 T 1450 450" strokeWidth="1.5" />
            <circle cx="50%" cy="50%" r="200" stroke="#0B4F3C" strokeWidth="1" strokeDasharray="4 4" />
          </svg>

          {/* Floating Price Pill Markers */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            {filteredProperties.map((prop, index) => {
              const isSelected = selectedProp?.id === prop.id
              const offsetX = (index % 3 - 1) * 120
              const offsetY = Math.floor(index / 3) * 90 - 40

              return (
                <div
                  key={prop.id}
                  style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
                  className="absolute transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedProp(prop)}
                    className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-md shadow-md transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'bg-brand-green border-brand-green text-white font-bold scale-110 z-30 ring-2 ring-brand-green/20'
                        : 'bg-white border-brand-green/30 text-brand-green hover:bg-brand-soft hover:scale-105 z-20'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-brand-green'}`} />
                    <span className="text-xs font-mono font-bold tracking-tight">{prop.formattedPrice}</span>

                    {/* Subtle Pulsing Ring */}
                    {isSelected && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-green rounded-full animate-ping opacity-75" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-white/95 backdrop-blur-md border border-brand-green/20 rounded-md text-[10px] uppercase tracking-[0.18em] font-bold text-brand-green flex items-center gap-2 shadow-sm">
            <Navigation className="w-3.5 h-3.5 text-brand-green" />
            <span>Interactive Map</span>
          </div>
        </div>

        {/* Right Compact Property Preview Card & Proximity Stats */}
        <div className="w-full lg:w-1/3 p-6 sm:p-8 bg-white border-t lg:border-t-0 lg:border-l border-brand-green/15 flex flex-col justify-between space-y-6">
          {selectedProp ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-brand-green/10 pb-3">
                <span className="text-[10px] uppercase tracking-[0.18em] text-brand-green font-bold">
                  Selected Residence
                </span>
                <span className="text-xs font-mono text-brand-charcoal/60">{selectedProp.location.city}</span>
              </div>

              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-brand-green/15">
                <Image
                  src={selectedProp.images.hero}
                  alt={selectedProp.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xl font-bold text-brand-green font-sans block">{selectedProp.formattedPrice}</span>
                <h4 className="font-serif text-lg text-brand-charcoal font-normal">{selectedProp.title}</h4>
                <p className="text-xs text-brand-charcoal/70 font-light">{selectedProp.location.address}</p>
              </div>

              <div className="flex items-center space-x-3 text-xs text-brand-charcoal/80 font-mono py-2 border-y border-brand-green/10">
                <span>{selectedProp.specs.bedrooms} Beds</span>
                <span>·</span>
                <span>{selectedProp.specs.bathrooms} Baths</span>
                <span>·</span>
                <span>{selectedProp.specs.areaSqFt.toLocaleString()} sq ft</span>
              </div>

              <Link
                href={`/properties/${selectedProp.slug}`}
                className="w-full py-3 bg-brand-green text-white text-xs font-bold uppercase tracking-[0.16em] rounded-md flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors shadow-sm"
              >
                <span>View Property</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="text-xs text-brand-charcoal/50">Select a property marker on map</div>
          )}

          {/* Proximity Context */}
          <div className="pt-4 border-t border-brand-green/10 space-y-2.5">
            <h5 className="text-[10px] uppercase tracking-[0.18em] font-bold text-brand-charcoal/60">
              Neighbourhood Connections
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs text-brand-charcoal/80">
              {proximityList.map((item) => {
                const IconComponent = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-2 bg-brand-soft p-2 rounded-md border border-brand-green/10">
                    <IconComponent className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <div>
                      <span className="block text-[10px] text-brand-charcoal/60">{item.label}</span>
                      <span className="font-mono text-xs font-bold text-brand-charcoal">{item.dist}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
