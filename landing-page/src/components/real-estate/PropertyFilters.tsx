'use client'

import * as React from 'react'
import { CustomSelect } from './CustomSelect'
import { Filter, RotateCcw, X, Check } from 'lucide-react'

export interface FilterState {
  listingType: string
  location: string
  propertyType: string
  priceRange: string
  bedrooms: string
  amenities: string[]
  sortBy: string
}

interface PropertyFiltersProps {
  filters: FilterState
  onFilterChange: (newFilters: FilterState) => void
  onReset: () => void
  totalCount: number
  className?: string
}

export function PropertyFilters({
  filters,
  onFilterChange,
  onReset,
  totalCount,
  className = '',
}: PropertyFiltersProps) {
  const [isOpenMobile, setIsOpenMobile] = React.useState(false)

  const amenityOptions = [
    'Private Plunge Pool',
    '24/7 Security',
    'Smart Home Automation',
    'Wine Cellar',
    'Private Elevator Landing',
    'Golf Course Views',
    'Staff Quarters',
    'Indoor Heated Swimming Pool',
    'Private Clay Tennis Court',
  ]

  const locationOptions = [
    { value: '', label: 'All Destinations' },
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'goa', label: 'Goa' },
    { value: 'delhi-ncr', label: 'Delhi NCR' },
    { value: 'bangalore', label: 'Bangalore' },
    { value: 'hyderabad', label: 'Hyderabad' },
    { value: 'pune', label: 'Pune' },
  ]

  const typeOptions = [
    { value: '', label: 'All Property Types' },
    { value: 'Penthouse', label: 'Penthouse & Sky Villa' },
    { value: 'Villa', label: 'Architectural Villa' },
    { value: 'Apartment', label: 'Luxury Apartment' },
    { value: 'Estate', label: 'Heritage Estate' },
    { value: 'Commercial', label: 'Commercial Assets' },
  ]

  const priceOptions = [
    { value: '', label: 'Any Price' },
    { value: '0-15', label: 'Up to ₹15 Cr' },
    { value: '15-30', label: '₹15 Cr – ₹30 Cr' },
    { value: '30-50', label: '₹30 Cr – ₹50 Cr' },
    { value: '50+', label: '₹50 Cr+' },
  ]

  const handleAmenityToggle = (amenity: string) => {
    const current = filters.amenities || []
    const updated = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity]

    onFilterChange({ ...filters, amenities: updated })
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-brand-green/10">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-green" />
          <span className="text-xs uppercase tracking-[0.16em] font-bold text-brand-charcoal">
            Refine Search
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="px-2.5 py-1 bg-brand-soft hover:bg-brand-green hover:text-white border border-brand-green/20 text-brand-green text-[11px] font-bold tracking-wider rounded-md flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-brand-green" />
          <span>Reset</span>
        </button>
      </div>

      {/* Destination / Location CustomSelect */}
      <CustomSelect
        label="Destination"
        options={locationOptions}
        value={filters.location}
        onChange={(val) => onFilterChange({ ...filters, location: val })}
      />

      {/* Property Type CustomSelect */}
      <CustomSelect
        label="Property Type"
        options={typeOptions}
        value={filters.propertyType}
        onChange={(val) => onFilterChange({ ...filters, propertyType: val })}
      />

      {/* Price Budget CustomSelect */}
      <CustomSelect
        label="Price Range"
        options={priceOptions}
        value={filters.priceRange}
        onChange={(val) => onFilterChange({ ...filters, priceRange: val })}
      />

      {/* Bedrooms */}
      <div className="space-y-2.5">
        <label className="text-[11px] uppercase tracking-wider text-brand-charcoal/80 font-bold block">
          Min Bedrooms
        </label>
        <div className="flex items-center gap-2">
          {['', '3', '4', '5'].map((bed) => (
            <button
              key={bed}
              type="button"
              onClick={() => onFilterChange({ ...filters, bedrooms: bed })}
              className={`flex-1 py-2 text-xs font-mono font-bold rounded-md border transition-all cursor-pointer ${
                filters.bedrooms === bed
                  ? 'bg-brand-green text-white border-brand-green shadow-sm'
                  : 'bg-brand-soft text-brand-charcoal border-brand-green/20 hover:border-brand-green/50'
              }`}
            >
              {bed === '' ? 'Any' : `${bed}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Luxury Amenities */}
      <div className="space-y-3 pt-4 border-t border-brand-green/10">
        <label className="text-[11px] uppercase tracking-wider text-brand-charcoal/80 font-bold block">
          Curated Amenities
        </label>
        <div className="space-y-2">
          {amenityOptions.map((amenity) => {
            const isChecked = filters.amenities.includes(amenity)
            return (
              <label
                key={amenity}
                onClick={() => handleAmenityToggle(amenity)}
                className="flex items-center gap-2.5 text-xs text-brand-charcoal hover:text-brand-green cursor-pointer select-none py-1"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    isChecked
                      ? 'bg-brand-green border-brand-green text-white font-bold'
                      : 'border-brand-green/30 bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>{amenity}</span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Filter Sidebar */}
      <div className={`hidden lg:block bg-white border border-brand-green/15 rounded-lg p-6 shadow-sm ${className}`}>
        <FilterContent />
      </div>

      {/* Mobile Drawer Trigger Button */}
      <div className="lg:hidden mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setIsOpenMobile(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-green text-white border border-brand-green rounded-md text-xs font-bold uppercase tracking-widest shadow-md cursor-pointer"
        >
          <Filter className="w-4 h-4 text-white" />
          <span>Filters & Refine</span>
        </button>

        <span className="text-xs text-brand-charcoal/80 font-mono font-semibold">
          {totalCount} Properties
        </span>
      </div>

      {/* Mobile Filter Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpenMobile(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white border-l border-brand-green/15 p-6 overflow-y-auto z-50">
            <div className="flex items-center justify-between pb-4 border-b border-brand-green/10 mb-6">
              <span className="text-sm font-serif text-brand-charcoal font-normal">Filters</span>
              <button
                type="button"
                onClick={() => setIsOpenMobile(false)}
                className="p-1.5 bg-brand-soft text-brand-green border border-brand-green/20 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <FilterContent />

            <button
              type="button"
              onClick={() => setIsOpenMobile(false)}
              className="mt-8 w-full py-3.5 bg-brand-green text-white font-bold text-xs uppercase tracking-widest rounded-md cursor-pointer shadow-md hover:bg-brand-dark"
            >
              Show {totalCount} Properties
            </button>
          </div>
        </div>
      )}
    </>
  )
}
