'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  ShieldCheck,
  Scale,
  HeartHandshake,
  Sparkles,
  Award,
  CheckCircle2
} from 'lucide-react'

export function BrandValuesSection() {
  const pillars = [
    {
      icon: ShieldCheck,
      title: 'Faith (Aastha & Sanctity)',
      tag: 'Unwavering Trust',
      desc: 'We treat land plot acquisition as a sacred, multi-generational decision. Every plot is backed by a 30-year legal search report, clear vector demarcation, and zero-dispute guarantee.',
    },
    {
      icon: Scale,
      title: 'Ethics (Niti & Integrity)',
      tag: '100% Transparency',
      desc: 'Absolute clarity in pricing. Zero hidden Preferential Location Charges (PLC), transparent differential commissions for advisors, and strict RERA compliance.',
    },
    {
      icon: HeartHandshake,
      title: 'Values (Mulya & Relationships)',
      tag: 'Client First',
      desc: 'We prioritize enduring customer peace of mind over short-term transaction volume. From initial site tour to Sub-Registrar registry execution, we stand by you.',
    },
  ]

  return (
    <div className="relative space-y-10">
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-brand-soft border border-brand-green/20 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-brand-green" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green">
            OUR GUIDING PHILOSOPHY
          </span>
        </div>

        <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-brand-charcoal font-semibold leading-[1.1] tracking-tight">
          Faith • Ethics • Values
        </h2>

        <p className="text-base sm:text-lg text-brand-charcoal/70 font-normal leading-relaxed max-w-2xl mx-auto">
          What guides our decisions and shapes lasting trust.
        </p>
      </div>

      {/* 3 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {pillars.map((item, idx) => {
          const IconComponent = item.icon
          return (
            <div
              key={idx}
              className="bg-brand-soft/40 hover:bg-[#E8F0EC] border border-brand-green/15 hover:border-brand-green/40 p-6 sm:p-8 rounded-2xl transition-all duration-300 space-y-4 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 bg-white border border-brand-green/20 rounded-2xl flex items-center justify-center text-brand-green shadow-sm group-hover:bg-brand-green group-hover:text-white transition-colors">
                  <IconComponent className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green bg-white px-2.5 py-0.5 rounded border border-brand-green/20 inline-block">
                    {item.tag}
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-brand-charcoal group-hover:text-brand-green transition-colors">
                    {item.title}
                  </h3>
                </div>

                <p className="text-sm text-brand-charcoal/75 font-normal leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-brand-green/10 flex items-center gap-2 text-xs font-bold text-brand-green">
                <CheckCircle2 className="w-4 h-4 text-brand-green" />
                <span>House & Sky Benchmark Standard</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
