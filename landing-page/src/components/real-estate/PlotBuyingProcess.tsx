'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  MapPin,
  FileCheck2,
  Compass,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'

export function PlotBuyingProcess() {
  const steps = [
    {
      num: '01',
      icon: MapPin,
      title: 'VIP Site Tour & Location Inspection',
      desc: 'Schedule a complimentary private site visit. Tour the township layout, arterial 18m roads, subterranean electrical conduits, and green parks.',
      tag: 'Step 1 • Guided Tour',
    },
    {
      num: '02',
      icon: Compass,
      title: 'Interactive Vector Plot Selection',
      desc: 'Choose your preferred plot size (150 - 1,000 sq yards), facing orientation (East/North), corner status, and preferential location charges (PLC).',
      tag: 'Step 2 • Custom Choice',
    },
    {
      num: '03',
      icon: FileCheck2,
      title: 'Legal Title Audit & Due Diligence',
      desc: 'Access complete legal dossier: 30-year search report, 7/12 extract, NA (Non-Agricultural) conversion certificates, and RERA approval manifest.',
      tag: 'Step 3 • 100% Clear Title',
    },
    {
      num: '04',
      icon: KeyRound,
      title: 'Sub-Registrar Deed & Possession',
      desc: 'Execute formal sale deed at the Sub-Registrar Office with complete stamp duty assistance, physical pillar installation, and instant possession.',
      tag: 'Step 4 • Final Handover',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-soft border border-brand-green/15 rounded-md">
            <ShieldCheck className="w-4 h-4 text-brand-green" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green">
              TRANSPARENT ACQUISITION WORKFLOW
            </span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-brand-charcoal font-semibold leading-[1.15] tracking-tight">
            How You Secure Your Plot with House & Sky.
          </h2>
          <p className="text-base text-brand-charcoal/70 font-normal leading-relaxed">
            Our 4-step streamlined process eliminates legal risk, hidden charges, and paperwork delays.
          </p>
        </div>

        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-5 py-3 bg-brand-green hover:bg-brand-dark text-white font-bold text-xs uppercase tracking-[0.16em] rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
        >
          <span>Start Your Plot Journey</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
        {steps.map((s, idx) => {
          const IconComp = s.icon
          return (
            <div
              key={idx}
              className="bg-brand-soft/50 hover:bg-[#E8F0EC] border border-brand-green/15 hover:border-brand-green/40 p-6 rounded-2xl transition-all duration-300 space-y-4 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Giant Background Number */}
              <div className="absolute top-2 right-4 font-serif text-6xl font-extrabold text-brand-green/10 group-hover:text-brand-green/20 transition-colors pointer-events-none">
                {s.num}
              </div>

              <div className="space-y-3 relative z-10">
                <div className="w-12 h-12 bg-white border border-brand-green/20 rounded-xl flex items-center justify-center text-brand-green shadow-sm group-hover:bg-brand-green group-hover:text-white transition-colors">
                  <IconComp className="w-6 h-6" />
                </div>

                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-brand-green bg-white/80 border border-brand-green/20 px-2.5 py-0.5 rounded-md">
                  {s.tag}
                </span>

                <h3 className="font-serif text-2xl font-semibold text-brand-charcoal group-hover:text-brand-green transition-colors">
                  {s.title}
                </h3>

                <p className="text-sm text-brand-charcoal/70 font-normal leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-brand-green">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Guaranteed Standard</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
