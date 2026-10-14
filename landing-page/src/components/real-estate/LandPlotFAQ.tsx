'use client'

import * as React from 'react'
import {
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'

export function LandPlotFAQ() {
  const faqs = [
    {
      q: 'Are all House & Sky plots Non-Agricultural (NA) converted and RERA approved?',
      a: 'Yes, 100% of our plot offerings come with final Non-Agricultural (NA) land status, Town Planning (TP) scheme clearance, and RERA registration credentials. You receive full legal documentation prior to making any booking deposit.',
    },
    {
      q: 'Can out-of-state or NRI buyers purchase land in Dholera SIR or Noida corridors?',
      a: 'Absolutely. Any Indian citizen (resident or NRI) can legally buy Non-Agricultural (NA) demarcated residential or commercial plots across Dholera SIR, Gujarat, Noida, and Uttar Pradesh expressways with full title deed ownership.',
    },
    {
      q: 'How is physical plot demarcation verified during site visits?',
      a: 'Every plot is surveyed using GPS vector coordinates. Physical corner pillars made of reinforced RCC concrete are embedded with plot numbers on-site so you inspect your exact boundary pins.',
    },
    {
      q: 'What payment options and home loan assistance are available?',
      a: 'We offer flexible 20:80 milestone payment plans. Furthermore, leading nationalized & private banks (SBI, HDFC, ICICI, Bank of Baroda) provide land plot purchase loans for approved Townships.',
    },
    {
      q: 'What infrastructure is delivered inside the Township before registry?',
      a: 'All Townships include 12m & 18m asphalt/concrete internal roads, subterranean electric cabling, storm water drainage grids, LED streetlights, gated perimeter security walls, and manicured green parks.',
    },
  ]

  const [openIdx, setOpenIdx] = React.useState<number | null>(0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-soft border border-brand-green/15 rounded-md">
            <HelpCircle className="w-4 h-4 text-brand-green" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green">
              FREQUENTLY ASKED QUESTIONS
            </span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-brand-charcoal font-semibold leading-[1.15] tracking-tight">
            Everything You Need to Know About Plot Buying.
          </h2>
          <p className="text-base text-brand-charcoal/70 font-normal leading-relaxed">
            Transparent answers regarding legal title search reports, NA conversion, NRI eligibility, and physical demarcation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-brand-green bg-[#E8F0EC] border border-brand-green/20 px-4 py-2 rounded-xl font-bold shrink-0">
          <ShieldCheck className="w-4 h-4" />
          <span>30-Year Title Search Verified</span>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3 max-w-4xl mx-auto pt-2">
        {faqs.map((faq, i) => {
          const isOpen = openIdx === i
          return (
            <div
              key={i}
              className="border border-brand-green/15 rounded-2xl overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className={`w-full p-5 text-left flex items-center justify-between gap-4 font-serif text-base sm:text-lg font-bold transition-colors cursor-pointer ${
                  isOpen ? 'bg-brand-soft text-brand-green' : 'bg-white text-brand-charcoal hover:bg-brand-soft/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${isOpen ? 'text-brand-green' : 'text-brand-green/40'}`} />
                  <span>{faq.q}</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-brand-green shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="p-5 bg-white border-t border-brand-green/10 text-sm sm:text-base text-brand-charcoal/80 font-normal leading-relaxed space-y-2">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
