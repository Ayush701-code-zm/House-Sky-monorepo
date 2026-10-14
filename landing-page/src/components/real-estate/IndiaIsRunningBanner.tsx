'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  Zap,
  Building,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Navigation,
  Globe2,
  Check
} from 'lucide-react'

export function IndiaIsRunningBanner() {
  const infraMilestones = [
    {
      stat: '₹111 Lakh Cr',
      title: 'National Infra Pipeline',
      desc: 'Government expenditure driving unprecedented land parcel appreciation along industrial expressways.',
    },
    {
      stat: '109 Km',
      title: 'Dholera Smart Expressway',
      desc: 'Connecting Ahmedabad to Dholera SIR in 45 minutes with dedicated high-speed transport corridors.',
    },
    {
      stat: '3.4x',
      title: '5-Yr Plot Appreciation',
      desc: 'Demarcated land in SIR & Airport corridors consistently outperforming traditional real estate asset classes.',
    },
    {
      stat: '100% Plug & Play',
      title: 'Greenfield Smart Utilities',
      desc: 'Subterranean power, gas, fiber-optic & water grids ready for immediate residential & commercial construction.',
    },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#0B1A15] via-[#122A21] to-[#0A1612] text-white px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A96E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-brand-green/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-[1440px] mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-[#C9A96E]/15 border border-[#C9A96E]/40 rounded-full backdrop-blur-md">
            <Globe2 className="w-4 h-4 text-[#C9A96E] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-[#E5D5B5]">
              INDIA IS RUNNING • INFRASTRUCTURE SUPERCYCLE
            </span>
          </div>

          <span className="text-xs font-semibold text-white/70 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            Smart City Land Acquisition Model
          </span>
        </div>

        {/* Banner Title & Copy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.15] text-white">
              Capitalize on India&apos;s Fastest Growing <span className="italic font-light text-[#E5D5B5] underline decoration-[#C9A96E]/50 underline-offset-8">Economic Corridors.</span>
            </h2>
            <p className="text-sm sm:text-base text-white/80 font-light leading-relaxed max-w-2xl">
              India is building world-class Greenfield Smart Cities, 8-lane expressways, and semiconductor hubs at breakneck speed. House & Sky acquires prime demarcated land parcels ahead of infrastructure delivery so you capture maximum equity upside.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-center space-y-3">
            <div className="bg-black/40 border border-[#C9A96E]/40 p-4 sm:p-5 rounded-2xl backdrop-blur-md space-y-2 w-full max-w-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#C9A96E] tracking-widest">Growth Guarantee</span>
                <Sparkles className="w-4 h-4 text-[#C9A96E]" />
              </div>
              <div className="text-xl font-serif font-bold text-white">100% Vector Demarcated</div>
              <p className="text-xs text-white/70">Clear demarcation pins, NA land permission, and NA-PLOTTED title deed guarantees.</p>
            </div>
          </div>
        </div>

        {/* Infra Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {infraMilestones.map((m, i) => (
            <div
              key={i}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C9A96E]/40 p-5 rounded-2xl transition-all duration-300 space-y-2 group"
            >
              <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#E5D5B5] group-hover:text-white transition-colors block">
                {m.stat}
              </span>
              <h4 className="font-bold text-sm text-white">{m.title}</h4>
              <p className="text-xs text-white/70 font-light leading-snug">{m.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Strip */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Check className="w-4 h-4 text-[#10B981]" />
            <span>Over 1,200+ Demarcated Plots Transacted Across Prime Smart Corridors</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="px-6 py-3 bg-[#C9A96E] hover:bg-[#b5955a] text-black font-extrabold text-xs uppercase tracking-[0.16em] rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <span>Explore High-Growth Corridors</span>
              <ArrowUpRight className="w-4 h-4 text-black" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
