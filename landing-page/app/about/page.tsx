import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, CheckCircle2, Award, Building2, Landmark, Hotel, HeartHandshake } from 'lucide-react'
import { PageSection } from '@/components/layout/PageSection'

export const metadata = {
  title: 'About Us — House & Sky | Elevating Lifestyles',
  description: 'House & Sky is a diversified business group driven by a vision to create enduring value, foster growth, and elevate lifestyles — built on trust, integrity, and innovation.',
}

const sectors = [
  {
    icon: Building2,
    title: 'Real Estate',
    desc: `Curated residential and commercial properties across India's prime micro-markets, built on legal clarity and architectural merit.`,
  },
  {
    icon: Landmark,
    title: 'Infrastructure & Construction',
    desc: 'End-to-end development of townships, plotted schemes, and civic infrastructure that stand the test of time.',
  },
  {
    icon: Hotel,
    title: 'Hospitality & Leisure',
    desc: 'Crafting immersive hospitality experiences anchored in heritage, design, and personalised service.',
  },
  {
    icon: HeartHandshake,
    title: 'Social Impact Initiatives',
    desc: 'Contributing to the economic and social progress of communities through purposeful, people-first programmes.',
  },
]

const strengths = [
  'Experience & strategic thinking rooted in two decades of market execution',
  'Customer-centric values that place trust and transparency at every touchpoint',
  'Innovation-led approach to identifying and developing high-potential opportunities',
  'Long-term growth mindset focused on sustainable, compounding value creation',
]

const milestones = [
  { year: '2004', title: 'Platform Founded', desc: 'Established to connect buyers with architecturally significant properties and open sky plots.' },
  { year: '2018', title: 'Pan-India Footprint', desc: 'Extended advisory desks across Mumbai, Goa, Delhi NCR, Bangalore, and Hyderabad.' },
  { year: '2022', title: '₹3,000 Cr Milestone', desc: 'Surpassed ₹3,000 Cr in residential property and land plot transaction volume.' },
  { year: '2026', title: 'AI Property Intelligence', desc: 'Launched AI-powered property discovery, government map integration, and a pan-India advisory network spanning 7 tiers.' },
]

export default function AboutPage() {
  return (
    <div>
      <PageSection tone="white">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-brand-soft border border-brand-green/20 rounded-full">
            <Award className="w-3.5 h-3.5 text-brand-green" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green">
              OUR VISION
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl text-[#171A18] font-semibold max-w-4xl leading-tight">
            House&nbsp;&amp;&nbsp;Sky — Elevating&nbsp;Lifestyles.
          </h1>

          <p className="text-base sm:text-lg text-[#171A18]/70 font-normal max-w-3xl leading-relaxed">
            House &amp; Sky is a diversified business group driven by a vision to create enduring value, foster growth,
            and elevate lifestyles. Built on the principles of <strong className="font-semibold text-[#171A18]">trust, integrity, and innovation</strong>,
            we are committed to developing opportunities that contribute to the economic and social progress of the communities we serve.
          </p>

          <p className="text-base text-[#171A18]/70 font-normal max-w-3xl leading-relaxed">
            With a forward-looking approach and a passion for excellence, House &amp; Sky operates across multiple sectors —
            delivering quality, creating meaningful experiences, and building sustainable value for our customers, partners, and stakeholders.
          </p>
        </div>
      </PageSection>

      <PageSection tone="muted">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-brand-green/15">
            <Image
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85&auto=format&fit=crop"
              alt="House & Sky — Building Trust, Delivering Value"
              fill
              className="object-cover"
            />
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B4F3C]">WHO WE ARE</span>
              <h2 className="font-serif text-4xl sm:text-5xl text-[#171A18] font-semibold leading-snug">
                We don&apos;t just build businesses — we create opportunities.
              </h2>
            </div>

            <p className="text-base text-[#171A18]/80 font-normal leading-relaxed">
              Our strength lies in combining experience, strategic thinking, and customer-centric values to identify
              opportunities, embrace innovation, and drive long-term growth. As we continue to expand our footprint,
              our focus remains unwavering — to create a positive impact, inspire confidence, and contribute to a better tomorrow.
            </p>

            <p className="text-base text-[#171A18]/80 font-normal leading-relaxed">
              At House &amp; Sky, we shape experiences and elevate lifestyles — one community at a time.
            </p>

            <div className="pt-2 space-y-3">
              {strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#0B4F3C] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#171A18] font-semibold leading-relaxed">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection tone="white">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B4F3C]">WHAT WE DO</span>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#171A18] font-semibold">Our Business Sectors</h2>
          <p className="text-base text-[#171A18]/60 font-normal max-w-xl mx-auto leading-relaxed">
            A diversified portfolio built to deliver value across the economic and social fabric of India.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sectors.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className="bg-white border border-brand-green/15 p-7 rounded-2xl space-y-4 hover:border-brand-green/40 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand-green/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#0B4F3C]" />
                </div>
                <h3 className="font-serif text-2xl text-[#171A18] font-semibold">{s.title}</h3>
                <p className="text-sm text-[#171A18]/65 font-normal leading-relaxed">{s.desc}</p>
              </div>
            )
          })}
        </div>
      </PageSection>

      <PageSection tone="muted">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B4F3C]">MILESTONES</span>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#171A18] font-semibold">Two Decades of Execution</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {milestones.map((m) => (
            <div key={m.year} className="bg-white border border-brand-green/15 p-6 rounded-2xl space-y-3">
              <span className="font-mono text-3xl font-bold text-[#0B4F3C] block">{m.year}</span>
              <h4 className="font-serif text-2xl text-[#171A18] font-semibold">{m.title}</h4>
              <p className="text-sm text-[#171A18]/70 font-normal leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <section className="bg-brand-green text-white px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-[1440px] mx-auto text-center space-y-6">
          <h2 className="font-serif text-4xl sm:text-5xl text-white font-semibold">Experience Confidential Representation</h2>
          <p className="text-base text-white/80 max-w-lg mx-auto font-normal leading-relaxed">
            Connect with our senior partners for private portfolio reviews, off-market viewing access, and land plot developments.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#0B4F3C] font-bold text-sm uppercase tracking-widest hover:bg-brand-soft rounded-xl transition-all cursor-pointer border border-white"
          >
            <span>Schedule Private Consultation</span>
            <ArrowUpRight className="w-4 h-4 text-[#0B4F3C]" />
          </Link>
        </div>
      </section>
    </div>
  )
}
