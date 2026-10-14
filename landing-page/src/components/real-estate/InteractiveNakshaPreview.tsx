'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Compass,
  MapPin,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowUpRight,
  Eye,
  Layers,
  Check
} from 'lucide-react'

export function InteractiveNakshaPreview() {
  const samplePlots = [
    { id: '101', size: '1,800 sqft', yards: '200 sqyd', facing: 'East Facing', road: '18m Main Boulevard', plc: 'Standard', status: 'AVAILABLE', price: '₹44.1 Lakh' },
    { id: '102', size: '2,250 sqft', yards: '250 sqyd', facing: 'North Facing', road: '12m Sector Road', plc: 'Park View (+5%)', status: 'AVAILABLE', price: '₹57.5 Lakh' },
    { id: '103', size: '3,600 sqft', yards: '400 sqyd', facing: 'North-East Corner', road: '18m Corner Boulevard', plc: 'Double PLC (+15%)', status: 'RESERVED', price: '₹95.2 Lakh' },
    { id: '104', size: '1,800 sqft', yards: '200 sqyd', facing: 'East Facing', road: '12m Sector Road', plc: 'Standard', status: 'AVAILABLE', price: '₹44.1 Lakh' },
    { id: '105', size: '1,350 sqft', yards: '150 sqyd', facing: 'West Facing', road: '12m Sector Road', plc: 'Standard', status: 'SOLD', price: '₹33.0 Lakh' },
    { id: '106', size: '2,700 sqft', yards: '300 sqyd', facing: 'East Corner', road: '18m Commercial Belt', plc: 'Commercial PLC (+20%)', status: 'AVAILABLE', price: '₹79.3 Lakh' },
  ]

  const [selectedPlot, setSelectedPlot] = React.useState(samplePlots[0])

  return (
    <section className="bg-brand-soft border border-brand-green/20 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-brand-green/20 rounded-md">
            <Layers className="w-4 h-4 text-brand-green" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-green">
              AI VECTOR MAP DEMARCATION
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-charcoal font-normal leading-[1.15] tracking-tight">
            Interactive Naksha & Plot Layout Preview.
          </h2>
          <p className="text-xs sm:text-sm text-brand-charcoal/70 font-light leading-relaxed">
            Click on any plot parcel below to inspect exact dimensions, road widths, preferential location charges (PLC), and live availability.
          </p>
        </div>

        <Link
          href="/properties"
          className="inline-flex items-center gap-2 px-5 py-3 bg-brand-green hover:bg-brand-dark text-white font-bold text-xs uppercase tracking-[0.16em] rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
        >
          <span>View All 150+ Plot Vector Maps</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Interactive Plot Grid (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-brand-green/15 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-brand-green/10 text-xs font-bold text-brand-charcoal">
            <span>Dholera Sector 4 Masterplan Grid</span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-brand-green rounded-full inline-block" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#C9A96E] rounded-full inline-block" /> Reserved</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-gray-400 rounded-full inline-block" /> Sold</span>
            </div>
          </div>

          {/* Naksha Grid Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {samplePlots.map((plot) => {
              const isSelected = selectedPlot.id === plot.id
              const isSold = plot.status === 'SOLD'
              const isReserved = plot.status === 'RESERVED'

              let statusBg = 'border-brand-green/30 bg-[#E8F0EC] text-brand-green'
              if (isSold) statusBg = 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
              if (isReserved) statusBg = 'border-[#C9A96E]/50 bg-[#FDF8EE] text-[#B38738]'

              return (
                <button
                  key={plot.id}
                  onClick={() => !isSold && setSelectedPlot(plot)}
                  disabled={isSold}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 relative ${statusBg} ${
                    isSelected ? 'ring-2 ring-brand-green ring-offset-2 shadow-md bg-brand-green text-white border-brand-green' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-serif text-lg font-bold ${isSelected ? 'text-white' : ''}`}>
                      Plot #{plot.id}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white/80 border border-brand-green/20'
                    }`}>
                      {plot.status}
                    </span>
                  </div>
                  <div className={`text-xs mt-1 font-semibold ${isSelected ? 'text-white/90' : 'text-brand-charcoal/80'}`}>
                    {plot.yards} ({plot.size})
                  </div>
                  <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/70' : 'text-brand-charcoal/60'}`}>
                    {plot.facing}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Plot Detail Inspector Card (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-brand-green/20 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-green/15">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-green">
                SELECTED PARCEL INSPECTOR
              </span>
              <span className="px-2.5 py-0.5 bg-brand-green text-white text-[10px] uppercase font-bold rounded-md">
                Plot #{selectedPlot.id}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-brand-charcoal/60 block uppercase font-bold tracking-wider">Allotment Price</span>
              <div className="font-serif text-3xl font-extrabold text-brand-charcoal">
                {selectedPlot.price}
              </div>
            </div>

            {/* Plot Specs Table */}
            <div className="space-y-2 pt-2 border-t border-brand-green/10 text-xs">
              <div className="flex justify-between py-1.5 border-b border-brand-green/10">
                <span className="text-brand-charcoal/70">Demarcated Area:</span>
                <span className="font-bold text-brand-charcoal">{selectedPlot.size} ({selectedPlot.yards})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-brand-green/10">
                <span className="text-brand-charcoal/70">Facing Orientation:</span>
                <span className="font-bold text-brand-charcoal">{selectedPlot.facing}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-brand-green/10">
                <span className="text-brand-charcoal/70">Frontage Road Width:</span>
                <span className="font-bold text-brand-charcoal">{selectedPlot.road}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-brand-green/10">
                <span className="text-brand-charcoal/70">PLC Structure:</span>
                <span className="font-bold text-brand-green">{selectedPlot.plc}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-brand-charcoal/70">Legal Search Status:</span>
                <span className="font-bold text-[#10B981] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 100% Title Clear
                </span>
              </div>
            </div>
          </div>

          <Link
            href={`/contact?subject=Hold+Plot+%23${selectedPlot.id}&plotId=${selectedPlot.id}`}
            className="w-full py-3.5 bg-brand-green hover:bg-brand-dark text-white font-bold text-xs uppercase tracking-[0.16em] rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Hold Plot #{selectedPlot.id} for 48 Hours</span>
            <ArrowUpRight className="w-4 h-4 text-white" />
          </Link>
        </div>
      </div>
    </section>
  )
}
