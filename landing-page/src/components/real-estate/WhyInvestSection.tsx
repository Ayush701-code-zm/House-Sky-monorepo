'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  ShieldCheck,
  Landmark,
  MapPin,
  ArrowUpRight,
  BadgeIndianRupee,
  Trees,
  FileCheck2,
} from 'lucide-react'

const REASONS = [
  {
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    title: 'Highest Long-Term ROI',
    desc: 'Land appreciates 3–5× faster than built structures. No depreciation, no maintenance costs — pure asset growth.',
    stat: '18–24% CAGR',
    statLabel: 'Avg. Annual Appreciation',
  },
  {
    icon: ShieldCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    title: 'Zero Depreciation Asset',
    desc: 'Unlike apartments, land never depreciates. It is the only asset class that reliably appreciates with national development.',
    stat: '100%',
    statLabel: 'Tangible Ownership',
  },
  {
    icon: BadgeIndianRupee,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    title: 'Low Entry, High Return',
    desc: 'Start with plots from ₹18L. No GST on resale, no society charges, no maintenance fees — maximum net return.',
    stat: '₹18L+',
    statLabel: 'Entry Point',
  },
  {
    icon: Landmark,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    title: 'Government-Backed Projects',
    desc: 'All House & Sky townships are situated within government-notified zones with RERA registration and legal title clearance.',
    stat: 'RERA',
    statLabel: 'Approved & Registered',
  },
  {
    icon: FileCheck2,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    title: 'Clear Freehold Title',
    desc: 'Every plot comes with full title deed, survey number, and mutation records — zero legal disputes, pure ownership.',
    stat: '100%',
    statLabel: 'Title Clear Guarantee',
  },
  {
    icon: Trees,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    title: 'Infrastructure-Led Value',
    desc: 'Proximity to expressways, airports, and smart city corridors means your plot value grows with national infrastructure.',
    stat: '6-Lane',
    statLabel: 'Expressway Connectivity',
  },
]

const MACRO_STATS = [
  { value: '₹100L Cr+', label: 'India Infrastructure Pipeline (2025–30)' },
  { value: '23 Cities', label: 'Under Smart City Mission development' },
  { value: '920 km²', label: 'Dholera SIR — Largest Indian Greenfield City' },
  { value: '5–10×', label: 'Projected land value multiplier by 2035' },
]

export function WhyInvestSection() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-brand-green">
          INVESTMENT THESIS
        </span>
        <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-brand-charcoal font-semibold leading-tight">
          Why Land Plots Outperform Every <br className="hidden sm:block" />
          Other Asset Class in India.
        </h2>
        <p className="text-base text-brand-charcoal/60 font-normal leading-relaxed">
          With India&apos;s fastest infrastructure expansion in history, government-backed land in notified investment zones
          offers unmatched returns, legal security, and long-term wealth creation.
        </p>
      </div>

      {/* Macro Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {MACRO_STATS.map((s) => (
          <div
            key={s.label}
            className="bg-brand-charcoal text-white rounded-2xl p-5 text-center space-y-1 border border-white/5"
          >
            <span className="block font-serif text-2xl sm:text-3xl font-bold text-[#C9A96E]">{s.value}</span>
            <span className="block text-[10px] text-white/60 font-semibold uppercase tracking-wider leading-snug">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Reason Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {REASONS.map((r) => {
          const Icon = r.icon
          return (
            <div
              key={r.title}
              className={`bg-white border ${r.border} rounded-2xl p-6 space-y-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
            >
              {/* Icon + stat */}
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${r.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${r.color}`} />
                </div>
                <div className="text-right">
                  <span className={`block text-lg font-extrabold font-mono ${r.color}`}>{r.stat}</span>
                  <span className="block text-[9px] font-bold text-brand-charcoal/40 uppercase tracking-wider">{r.statLabel}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-serif text-xl text-brand-charcoal font-semibold leading-snug">{r.title}</h3>
                <p className="text-sm text-brand-charcoal/65 font-normal leading-relaxed">{r.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom CTA strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-soft border border-brand-green/20 rounded-2xl px-6 py-5">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-brand-green shrink-0" />
          <p className="text-sm font-semibold text-brand-charcoal">
            Ready to identify the right plot for your investment goals?
          </p>
        </div>
        <Link
          href="/projects"
          className="shrink-0 inline-flex items-center gap-2 px-6 py-2.5 bg-brand-green hover:bg-brand-dark text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
        >
          Browse All Projects <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
