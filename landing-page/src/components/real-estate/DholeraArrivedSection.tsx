'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  MapPin,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Plane,
  Cpu,
  ChevronRight,
  BarChart3,
  Compass,
  FileCheck2,
  PhoneCall
} from 'lucide-react'

export function DholeraArrivedSection() {
  const [activeHighlight, setActiveHighlight] = React.useState<number>(0)

  const highlights = [
    {
      icon: Cpu,
      title: 'Tata Semiconductor Giga Fab Hub',
      shortTitle: 'Semiconductor Hub',
      desc: 'Adjacent to India’s ₹91,000 Cr Tata-Powerchip Mega Fab plant, sparking massive industrial expansion and high land demand.',
      badge: 'High Value Zone',
      tag: '₹91,000 Cr Plant',
      color: 'from-amber-500/20 to-emerald-500/10'
    },
    {
      icon: Plane,
      title: 'Dholera International Airport',
      shortTitle: 'Greenfield Airport',
      desc: 'Located minutes away from the upcoming 4-runway international cargo & passenger airport connecting global trade hubs.',
      badge: 'Connectivity',
      tag: '4-Runway Airport',
      color: 'from-blue-500/20 to-emerald-500/10'
    },
    {
      icon: Zap,
      title: 'Ahmedabad-Dholera Expressway',
      shortTitle: 'Expressway',
      desc: 'Seamless travel via the 109 km 6-lane access-controlled expressway connecting Ahmedabad to Dholera SIR in just 45 minutes.',
      badge: '45-Min Transit',
      tag: '109 KM Expressway',
      color: 'from-amber-500/20 to-yellow-500/10'
    },
    {
      icon: ShieldCheck,
      title: '100% Title Clear & Demarcated Plots',
      shortTitle: 'Clear Title Plots',
      desc: 'Every House & Sky plot features laser demarcated boundaries, vector survey maps, NA/NOC approvals, and direct Registry transfer.',
      badge: 'Zero Legal Risk',
      tag: 'Direct Registry',
      color: 'from-emerald-500/20 to-teal-500/10'
    },
  ]

  const stats = [
    { value: '920 Sq. Km', label: 'SIR Greenfield Area', sub: 'Largest In India', icon: Compass },
    { value: '₹91,000 Cr+', label: 'Anchor Investments', sub: 'Semiconductor Fab', icon: BarChart3 },
    { value: '45 Mins', label: 'Expressway Transit', sub: 'From Ahmedabad', icon: Zap },
    { value: '35%+ P.A.', label: 'Targeted Appreciation', sub: 'Projected Yield', icon: FileCheck2 },
  ]

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden bg-gradient-to-br from-[#081511] via-[#0F221B] to-[#060D0B] text-white px-4 sm:px-6 lg:px-8 py-16 sm:py-20 transition-all duration-300"
    >
      {/* Dynamic Background Lighting Effects */}
      <div className="absolute top-0 right-0 -mt-24 -mr-24 w-72 sm:w-[480px] h-72 sm:h-[480px] bg-[#C9A96E]/12 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-72 sm:w-[480px] h-72 sm:h-[480px] bg-[#10B981]/12 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle Pattern Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none opacity-40" />

      {/* Main Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto space-y-6 sm:space-y-8">
        {/* Header Badges Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-[#C9A96E]/15 border border-[#C9A96E]/35 rounded-full backdrop-blur-md shadow-sm self-start">
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A96E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-[#C9A96E]"></span>
            </span>
            <span className="text-[9.5px] sm:text-xs font-black tracking-wider uppercase text-[#E5D5B5]">
              HISTORIC LAUNCH • GUJARAT SMART CITY
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-white/85 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 self-start sm:self-auto shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
            <span className="font-medium">Dholera SIR, Gujarat, India</span>
          </div>
        </div>

        {/* Hero Title & Intro Copy */}
        <div className="max-w-3xl space-y-2.5 sm:space-y-3.5">
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-white">
            House & Sky Has Arrived in{' '}
            <span className="italic font-light text-[#E5D5B5] underline decoration-[#C9A96E]/50 underline-offset-4 sm:underline-offset-8">
              Dholera Smart City.
            </span>
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-white/80 font-light leading-relaxed">
            India&apos;s first Greenfield Smart City meets House & Sky benchmark plot demarcation. Acquire vetted residential, commercial, and industrial plots with 100% legal clarity.
          </p>
        </div>

        {/* Mobile Interactive Quick Pill Selector (Visible on Small Screens) */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-1 px-1 snap-x">
            {highlights.map((item, idx) => {
              const IconComp = item.icon
              const isSelected = activeHighlight === idx
              return (
                <button
                  key={idx}
                  onClick={() => setActiveHighlight(idx)}
                  className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#C9A96E] text-black border-[#C9A96E] shadow-md shadow-[#C9A96E]/20'
                      : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-[#C9A96E]'}`} />
                  <span>{item.shortTitle}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Showcase Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch">
          {/* Main Visual Showcase (7 cols) */}
          <div className="lg:col-span-7 relative min-h-[340px] sm:min-h-[420px] rounded-2xl overflow-hidden border border-[#C9A96E]/30 group shadow-2xl bg-black/60 flex flex-col justify-between">
            <Image
              src="/images/dholera-smart-city.png"
              alt="House & Sky Dholera Smart City Masterplan"
              fill
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
            />
            {/* Deep Contrast Multi-Stop Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/25 pointer-events-none" />

            {/* Top Badges Overlay */}
            <div className="relative top-0 left-0 right-0 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 z-10">
              <div className="px-2.5 sm:px-3 py-1.5 bg-black/85 backdrop-blur-md rounded-xl border border-[#C9A96E]/40 text-[9.5px] sm:text-[10.5px] font-extrabold uppercase tracking-wider text-[#E5D5B5] flex items-center gap-1.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
                <span>Premier Greenfield Township</span>
              </div>
              <div className="px-2.5 sm:px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/50 backdrop-blur-md rounded-xl text-[9.5px] sm:text-[10.5px] font-bold text-emerald-300 uppercase tracking-wider shadow-md">
                Plots From ₹1,850 / sqft
              </div>
            </div>

            {/* Bottom Card Info Overlay */}
            <div className="relative bottom-0 left-0 right-0 m-3 sm:m-4 p-3.5 sm:p-5 bg-black/85 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/15 space-y-2 z-10 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#C9A96E]">
                  Masterplan Demarcation Enclave
                </span>
                <span className="text-[9.5px] px-2 py-0.5 bg-[#C9A96E]/20 text-[#E5D5B5] rounded-md font-mono font-bold border border-[#C9A96E]/30">
                  RERA Registered
                </span>
              </div>
              <h3 className="font-serif text-base sm:text-xl font-bold text-white leading-snug">
                Dholera Smart Enclave Phase 1 & 2
              </h3>
              <p className="text-[11px] sm:text-xs text-white/75 leading-relaxed font-light">
                100 ft wide arterial road access, subterranean utility conduits, 24/7 smart security fencing, and direct clear title deed transfer.
              </p>
            </div>
          </div>

          {/* Key Advantages Grid (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-2.5 sm:space-y-3">
            {highlights.map((item, idx) => {
              const IconComponent = item.icon
              const isSelected = activeHighlight === idx
              return (
                <motion.div
                  key={idx}
                  onClick={() => setActiveHighlight(idx)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className={`rounded-xl p-3 sm:p-3.5 transition-all duration-300 border cursor-pointer select-none ${
                    isSelected
                      ? 'bg-gradient-to-r ' + item.color + ' bg-black/60 border-[#C9A96E]/60 shadow-lg shadow-[#C9A96E]/10'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 sm:p-2.5 rounded-lg shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#C9A96E] text-black shadow-md'
                          : 'bg-[#C9A96E]/15 border border-[#C9A96E]/30 text-[#E5D5B5]'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <h4
                          className={`font-bold text-xs sm:text-sm transition-colors truncate ${
                            isSelected ? 'text-[#E5D5B5]' : 'text-white'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span
                          className={`text-[8.5px] sm:text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded shrink-0 ${
                            isSelected
                              ? 'bg-[#C9A96E]/30 text-[#E5D5B5] border border-[#C9A96E]/40'
                              : 'bg-white/10 text-white/80'
                          }`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-white/75 font-light leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Stats Grid Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 pt-1">
          {stats.map((st, i) => {
            const StatIcon = st.icon
            return (
              <div
                key={i}
                className="bg-black/45 border border-white/10 hover:border-[#C9A96E]/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl space-y-1.5 backdrop-blur-md transition-all duration-300 group shadow-sm hover:shadow-md hover:bg-black/60"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-wider truncate">
                    {st.sub}
                  </span>
                  <StatIcon className="w-3.5 h-3.5 text-[#C9A96E]/70 group-hover:text-[#C9A96E] transition-colors shrink-0" />
                </div>
                <div className="font-serif text-lg sm:text-2xl lg:text-3xl font-bold text-[#E5D5B5] leading-tight">
                  {st.value}
                </div>
                <div className="text-[9.5px] sm:text-xs text-white/70 font-medium tracking-wide leading-snug">
                  {st.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Action CTA Bar */}
        <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/85">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span className="leading-snug">Exclusive Priority Allotment Now Open for Early Investors</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/projects"
              className="w-full sm:w-auto px-5 sm:px-6 py-3.5 bg-gradient-to-r from-[#C9A96E] to-[#DFCA9F] hover:from-[#DFCA9F] hover:to-[#C9A96E] text-slate-950 font-extrabold text-xs uppercase tracking-[0.14em] rounded-xl transition-all duration-200 shadow-lg shadow-[#C9A96E]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Explore Dholera Plots</span>
              <ArrowUpRight className="w-4 h-4 text-slate-950 shrink-0" />
            </Link>

            <Link
              href="/contact?subject=Dholera+Plot+Inquiry"
              className="w-full sm:w-auto px-5 sm:px-6 py-3.5 bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md border border-white/25 text-white font-bold text-xs uppercase tracking-[0.14em] rounded-xl transition-all duration-200 shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span>Book Site Tour</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
