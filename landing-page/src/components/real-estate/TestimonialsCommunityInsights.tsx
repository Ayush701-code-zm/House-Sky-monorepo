'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  Star,
  Quote,
  CheckCircle2,
  Users,
  MapPin,
  Sparkles,
  TrendingUp
} from 'lucide-react'

export function TestimonialsCommunityInsights() {
  const testimonials = [
    {
      name: 'Rajesh & Sunita Malhotra',
      role: 'Plot Buyers in Dholera SIR',
      location: 'Dholera Smart City Enclave',
      rating: 5,
      comment:
        'Purchasing our 250 sqyd demarcated plot in Dholera with House & Sky was completely stress-free. The exact RCC boundary pillars were physically installed on day 1, and 7/12 NA documents were delivered before payment.',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    },
    {
      name: 'Vikramaditya Rao',
      role: 'Institutional NRI Land Investor',
      location: 'Noida Sector 150 Corridor',
      rating: 5,
      comment:
        'Being based in Singapore, transparency was critical. House & Sky provided live vector map inspection, clear PLC breakdown, and seamless video-assisted Registry scheduling.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    },
    {
      name: 'Ananya & Kabir Merchant',
      role: 'Township Villa Plot Owners',
      location: 'Royal Palms Executive City',
      rating: 5,
      comment:
        'The level of title clarity and customer service is unmatched in real estate land plot sales. Every road width and park facing commitment was fulfilled to the exact inch.',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80',
    },
  ]

  const communityStats = [
    { label: 'Client Satisfaction Rating', value: '4.9 / 5.0' },
    { label: 'Plots Demarcated & Handed Over', value: '1,200+' },
    { label: 'Certified Network Advisors', value: '45+ Team' },
    { label: 'Legal Title Guarantee', value: '100% Clear' },
  ]

  return (
    <div className="space-y-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-brand-green/20 rounded-md">
            <Users className="w-4 h-4 text-brand-green" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green">
              VERIFIED BUYER & ADVISOR VOICES
            </span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-brand-charcoal font-semibold leading-[1.15] tracking-tight">
            Our Testimonials & Community Insights.
          </h2>
          <p className="text-base text-brand-charcoal/70 font-normal leading-relaxed">
            Real feedback from land plot buyers, NRI investors, and township advisors who trust House & Sky.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-brand-green bg-white border border-brand-green/20 px-4 py-2 rounded-xl font-bold shrink-0">
          <TrendingUp className="w-4 h-4 text-brand-green" />
          <span>Over 1,200+ Happy Plot Owners</span>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((item, idx) => (
          <div
            key={idx}
            className="bg-white border border-brand-green/15 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between hover:border-brand-green/40 transition-all group"
          >
            <div className="space-y-3">
              {/* Rating Stars */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[#C9A96E]">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#C9A96E]" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-brand-green/20 group-hover:text-brand-green/40 transition-colors" />
              </div>

              <p className="text-sm text-brand-charcoal/80 font-normal italic leading-relaxed">
                &ldquo;{item.comment}&rdquo;
              </p>
            </div>

            <div className="pt-4 border-t border-brand-green/10 flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-brand-green/30 shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-brand-charcoal flex items-center gap-1">
                  <span>{item.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                </h4>
                <p className="text-[10px] text-brand-green font-semibold">{item.role}</p>
                <p className="text-[10px] text-brand-charcoal/60 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-brand-green" /> {item.location}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Community Insights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white border border-brand-green/15 rounded-2xl p-6 shadow-sm">
        {communityStats.map((st, i) => (
          <div key={i} className="text-center space-y-1">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-brand-charcoal block">
              {st.value}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-brand-green uppercase tracking-wider block">
              {st.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
