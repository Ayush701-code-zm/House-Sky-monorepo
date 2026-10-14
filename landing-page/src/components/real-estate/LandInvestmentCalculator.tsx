'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Calculator,
  TrendingUp,
  Coins,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Building2,
  PieChart
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'

export function LandInvestmentCalculator() {
  const [plotAreaSqft, setPlotAreaSqft] = React.useState(1800) // Default ~200 sq. yards
  const [basePricePerSqft, setBasePricePerSqft] = React.useState(2450)
  const [holdingYears, setHoldingYears] = React.useState(5)
  const [expectedGrowthRate, setExpectedGrowthRate] = React.useState(25) // 25% p.a.
  const [downPaymentPercent, setDownPaymentPercent] = React.useState(20)

  // Calculations
  const initialPlotCost = plotAreaSqft * basePricePerSqft
  const downPaymentAmount = (initialPlotCost * downPaymentPercent) / 100
  const loanAmount = initialPlotCost - downPaymentAmount

  // Compound Interest / Land Growth: FV = P * (1 + r)^t
  const projectedFutureValue = Math.round(
    initialPlotCost * Math.pow(1 + expectedGrowthRate / 100, holdingYears)
  )
  const totalNetCapitalGain = projectedFutureValue - initialPlotCost

  // Estimated Monthly EMI (at ~8.5% interest for 10 yrs)
  const monthlyRate = 0.085 / 12
  const totalMonths = 120
  const estimatedEMI = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
  )

  const presetLocations = [
    { name: 'Dholera Smart City SIR', rate: 1850, defaultGrowth: 32 },
    { name: 'Noida Sector 150 Corridor', rate: 4500, defaultGrowth: 22 },
    { name: 'Ayodhya Heritage Corridor', rate: 3200, defaultGrowth: 28 },
    { name: 'Expressway Tech Hub', rate: 2800, defaultGrowth: 24 },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-soft border border-brand-green/20 rounded-md">
            <Calculator className="w-4 h-4 text-brand-green" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green">
              SMART REAL ESTATE ANALYTICS
            </span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-brand-charcoal font-semibold leading-[1.15] tracking-tight">
            Land Plot ROI & Appreciation Calculator.
          </h2>
          <p className="text-base text-brand-charcoal/70 font-normal leading-relaxed">
            Project your wealth multiplication from demarcated land plot acquisitions across India&apos;s high-yield infrastructure corridors.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-brand-green bg-[#E8F0EC] border border-brand-green/20 px-4 py-2 rounded-xl font-bold shrink-0">
          <TrendingUp className="w-4 h-4" />
          <span>Historical Land Yield: 28.4% Avg. P.A.</span>
        </div>
      </div>

      {/* Preset Location Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <span className="text-xs font-bold text-brand-charcoal/60 uppercase tracking-wider mr-2">Quick Presets:</span>
        {presetLocations.map((loc) => (
          <button
            key={loc.name}
            onClick={() => {
              setBasePricePerSqft(loc.rate)
              setExpectedGrowthRate(loc.defaultGrowth)
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              basePricePerSqft === loc.rate
                ? 'bg-brand-green text-white border-brand-green shadow-sm'
                : 'bg-brand-soft text-brand-charcoal/80 border-brand-green/15 hover:border-brand-green/40'
            }`}
          >
            {loc.name} (₹{loc.rate}/sqft)
          </button>
        ))}
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Sliders & Controls (7 Cols) */}
        <div className="lg:col-span-7 bg-brand-soft/40 border border-brand-green/15 rounded-2xl p-6 space-y-6">
          {/* Plot Area Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-brand-charcoal">Plot Area Size:</span>
              <span className="text-brand-green text-sm">{plotAreaSqft.toLocaleString()} sq.ft ({Math.round(plotAreaSqft / 9)} sq. yards)</span>
            </div>
            <input
              type="range"
              min={900}
              max={9000}
              step={150}
              value={plotAreaSqft}
              onChange={(e) => setPlotAreaSqft(Number(e.target.value))}
              className="w-full h-2 bg-brand-green/20 rounded-lg appearance-none cursor-pointer accent-brand-green"
            />
            <div className="flex justify-between text-[10px] text-brand-charcoal/50">
              <span>900 sqft (100 sqyd)</span>
              <span>4,500 sqft (500 sqyd)</span>
              <span>9,000 sqft (1,000 sqyd)</span>
            </div>
          </div>

          {/* Base Price Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-brand-charcoal">Base Price / sq.ft:</span>
              <span className="text-brand-green text-sm">₹{basePricePerSqft.toLocaleString()} / sqft</span>
            </div>
            <input
              type="range"
              min={1200}
              max={8000}
              step={50}
              value={basePricePerSqft}
              onChange={(e) => setBasePricePerSqft(Number(e.target.value))}
              className="w-full h-2 bg-brand-green/20 rounded-lg appearance-none cursor-pointer accent-brand-green"
            />
          </div>

          {/* Holding Horizon & Expected Growth Rate Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-brand-charcoal">Holding Horizon:</span>
                <span className="text-brand-green">{holdingYears} Years</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={holdingYears}
                onChange={(e) => setHoldingYears(Number(e.target.value))}
                className="w-full h-2 bg-brand-green/20 rounded-lg appearance-none cursor-pointer accent-brand-green"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-brand-charcoal">Est. Annual Growth (P.A.):</span>
                <span className="text-brand-green">{expectedGrowthRate}% P.A.</span>
              </div>
              <input
                type="range"
                min={10}
                max={45}
                step={1}
                value={expectedGrowthRate}
                onChange={(e) => setExpectedGrowthRate(Number(e.target.value))}
                className="w-full h-2 bg-brand-green/20 rounded-lg appearance-none cursor-pointer accent-brand-green"
              />
            </div>
          </div>
        </div>

        {/* Results Summary Card (5 Cols) */}
        <div className="lg:col-span-5 bg-brand-charcoal text-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl border border-[#C9A96E]/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A96E]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A96E]">
                PROJECTED INVESTMENT SUMMARY
              </span>
              <Sparkles className="w-4 h-4 text-[#C9A96E]" />
            </div>

            {/* Total Plot Cost */}
            <div className="space-y-1">
              <span className="text-xs text-white/70 font-light block uppercase tracking-wider">Present Plot Acquisition Cost</span>
              <div className="font-serif text-3xl font-bold text-white">
                {formatCurrency(initialPlotCost)}
              </div>
            </div>

            {/* Projected Future Value */}
            <div className="bg-white/10 border border-[#C9A96E]/40 p-4 rounded-xl space-y-1 backdrop-blur-md">
              <div className="flex items-center justify-between text-xs text-[#E5D5B5] font-bold uppercase tracking-wider">
                <span>Estimated Value in {holdingYears} Years</span>
                <span className="text-[10px] bg-[#10B981]/20 text-[#6EE7B7] px-2 py-0.5 rounded font-mono">
                  +{((totalNetCapitalGain / initialPlotCost) * 100).toFixed(0)}% Total Gain
                </span>
              </div>
              <div className="font-serif text-3xl sm:text-4xl font-extrabold text-[#E5D5B5]">
                {formatCurrency(projectedFutureValue)}
              </div>
              <p className="text-[11px] text-white/70 font-light">
                Net capital gain projection: <strong className="text-white">{formatCurrency(totalNetCapitalGain)}</strong>
              </p>
            </div>

            {/* Flexible Down-payment & EMI Breakdown */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-[10px] text-white/60 uppercase font-bold block">Down Payment ({downPaymentPercent}%)</span>
                <span className="font-bold text-white text-sm mt-0.5 block">{formatCurrency(downPaymentAmount)}</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-[10px] text-white/60 uppercase font-bold block">Est. Monthly EMI</span>
                <span className="font-bold text-[#E5D5B5] text-sm mt-0.5 block">{formatCurrency(estimatedEMI)} / mo</span>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <Link
                href={`/contact?subject=Land+Investment+Calculator+Inquiry&plotArea=${plotAreaSqft}`}
                className="w-full py-3.5 bg-[#C9A96E] hover:bg-[#b5955a] text-black font-extrabold text-xs uppercase tracking-[0.16em] rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Reserve This Plot Parcel</span>
                <ArrowUpRight className="w-4 h-4 text-black" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
