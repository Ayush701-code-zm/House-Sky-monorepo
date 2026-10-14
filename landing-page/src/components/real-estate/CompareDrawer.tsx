'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PROPERTIES } from '@/data/properties'
import { useCompareStore } from '@/stores/compare.store'
import { X, Scale, ArrowUpRight } from 'lucide-react'

export function CompareDrawer() {
  const compareIds = useCompareStore((state) => state.compareIds)
  const toggleCompare = useCompareStore((state) => state.toggleCompare)
  const clearCompare = useCompareStore((state) => state.clearCompare)

  const [isOpenModal, setIsOpenModal] = React.useState(false)

  const selectedProperties = React.useMemo(() => {
    return PROPERTIES.filter((p) => compareIds.includes(p.id))
  }, [compareIds])

  if (compareIds.length === 0) return null

  return (
    <>
      {/* Floating Bottom Comparison Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#063B2D]/95 backdrop-blur-xl border border-white/20 shadow-2xl px-5 py-3.5 flex items-center justify-between gap-6 max-w-xl w-[92vw] rounded-2xl">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-gold-300 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-white font-mono">{compareIds.length} of 3</span>
            <span className="text-white/80 font-light ml-1">Properties Selected to Compare</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpenModal(true)}
            className="px-4 py-2 bg-gold-300 hover:bg-white text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            Compare Now
          </button>
          <button
            type="button"
            onClick={clearCompare}
            className="p-1.5 bg-white/10 text-white hover:bg-white hover:text-black border border-white/20 rounded-full transition-all cursor-pointer"
            title="Clear comparison"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full Comparison Matrix Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
          <div className="bg-[#0B4F3C] border border-white/20 max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/15">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-gold-300" />
                <h3 className="font-serif text-2xl text-white font-semibold">Residence Comparison Matrix</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="p-2 bg-white/10 border border-white/20 text-white rounded-full hover:bg-white hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Grid Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {selectedProperties.map((prop) => (
                <div key={prop.id} className="bg-white/10 border border-white/15 p-5 space-y-4 relative rounded-xl">
                  <button
                    type="button"
                    onClick={() => toggleCompare(prop.id)}
                    className="absolute top-3 right-3 p-1.5 bg-black/80 border border-white/30 text-white hover:bg-gold-300 hover:text-black rounded-full z-10 cursor-pointer"
                    title="Remove from comparison"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative aspect-[16/10] w-full overflow-hidden border border-white/15">
                    <Image src={prop.images.hero} alt={prop.title} fill className="object-cover" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-gold-300 font-bold uppercase tracking-widest block">{prop.location.area}, {prop.location.city}</span>
                    <h4 className="font-serif text-lg text-white font-semibold">{prop.title}</h4>
                    <span className="text-xl font-bold font-sans text-white block">{prop.formattedPrice}</span>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-white/15 text-xs font-mono text-white/90">
                    <div className="flex justify-between">
                      <span className="text-white/60">Carpet Area:</span>
                      <span>{prop.specs.areaSqFt.toLocaleString()} sq ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Rate/sq ft:</span>
                      <span>{prop.formattedPricePerSqFt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Bedrooms:</span>
                      <span>{prop.specs.bedrooms} Suites</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Bathrooms:</span>
                      <span>{prop.specs.bathrooms} Baths</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Parking:</span>
                      <span>{prop.specs.parkingSpaces} Bays</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Year Built:</span>
                      <span>{prop.specs.yearBuilt}</span>
                    </div>
                  </div>

                  <Link
                    href={`/properties/${prop.slug}`}
                    onClick={() => setIsOpenModal(false)}
                    className="w-full py-2.5 bg-gold-300 hover:bg-white text-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
                  >
                    <span>View Estate</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
