'use client'

import * as React from 'react'
import Link from 'next/link'
import { HouseAndSkyLogo } from './HouseAndSkyLogo'
import { Mail, MapPin, Phone, ShieldCheck, MessageCircle } from 'lucide-react'
import { SITE } from '@/utils/siteConfig'
import { getApiBaseUrl } from '@/utils/api'
import { cityPageHref } from '@/utils/cities'

export function Footer() {
  const [email, setEmail] = React.useState('')
  const [subscribed, setSubscribed] = React.useState(false)
  const [subscribeError, setSubscribeError] = React.useState('')
  const [isSubscribing, setIsSubscribing] = React.useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setIsSubscribing(true)
    setSubscribeError('')
    try {
      const res = await fetch(`${getApiBaseUrl()}/public/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Newsletter subscriber',
          email: trimmed,
          phone: '0000000000',
          inquiryType: 'NEWSLETTER',
          message: 'Footer newsletter signup'
        })
      }).catch(() => null)
      if (!res || !res.ok) {
        setSubscribeError('Could not subscribe right now. Please try again.')
        return
      }
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 5000)
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <footer className="bg-brand-dark text-white border-t border-brand-green/20 pt-16 pb-12 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16 border-b border-white/10 items-center">
          <div className="lg:col-span-6 space-y-3">
            <span className="text-[10px] uppercase tracking-[0.25em] text-brand-gold font-bold block">
              HOUSE & SKY INTELLIGENCE
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-white font-semibold leading-tight">
              Exceptional homes. Under open skies.
            </h3>
            <p className="text-xs text-white/70 max-w-md font-light leading-relaxed">
              Curated property digests delivered directly to private wealth clients and architectural enthusiasts.
            </p>
          </div>

          <div className="lg:col-span-6">
            <form onSubmit={handleSubscribe} noValidate className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <label htmlFor="newsletter-email" className="sr-only">Enter your email</label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email for private listings"
                  required
                  className="input-base input-on-dark min-h-[48px]"
                />
              </div>
              <button
                type="submit"
                disabled={isSubscribing}
                className="hs-btn-primary bg-brand-green hover:bg-white hover:text-brand-dark sm:w-auto uppercase tracking-[0.18em] min-h-[48px]"
              >
                {isSubscribing ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
            {subscribed && (
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Thank you for subscribing to House & Sky Private Access.
              </p>
            )}
            {subscribeError ? (
              <p className="text-xs text-red-300 mt-2 font-medium">{subscribeError}</p>
            ) : null}
          </div>
        </div>

        {/* Main Footer Links Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-16 border-b border-white/10">
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2 space-y-6">
            <HouseAndSkyLogo variant="light" showTagline={true} />
            <p className="text-xs text-white/70 font-light leading-relaxed max-w-sm">
              House & Sky is a premium real-estate platform connecting architectural homes, luxury penthouses, and landmark township plots with discerning buyers.
            </p>

            <div className="space-y-2.5 text-xs text-white/80">
              <a href={SITE.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-brand-gold transition-colors">
                <MapPin className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                <span>{SITE.address}</span>
              </a>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-brand-gold shrink-0" />
                <a href={`tel:${SITE.phoneTel}`} className="hover:text-brand-gold transition-colors">{SITE.phoneDisplay} · Advisory Desk</a>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold transition-colors">{SITE.whatsappDisplay} · WhatsApp Desk</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand-gold shrink-0" />
                <span>{SITE.email}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Properties */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
              Properties
            </h4>
            <ul className="space-y-1 sm:space-y-2.5 text-xs text-white/70 font-medium">
              <li>
                <Link href="/" className="block py-2 sm:py-0 hover:text-brand-gold transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/projects" className="block py-2 sm:py-0 hover:text-brand-gold transition-colors">Projects</Link>
              </li>
              <li>
                <Link href="/properties" className="block py-2 sm:py-0 hover:text-brand-gold transition-colors">Properties</Link>
              </li>
              <li>
                <Link href="/gallery" className="block py-2 sm:py-0 hover:text-brand-gold transition-colors">Gallery</Link>
              </li>
              <li>
                <Link href="/contact" className="block py-2 sm:py-0 hover:text-brand-gold transition-colors">Get In Touch</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Locations */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
              Locations
            </h4>
            <ul className="space-y-1 sm:space-y-2.5 text-xs text-white/70 font-medium">
              <li>
                <Link href={cityPageHref('Mumbai')} className="block py-2 sm:py-0 hover:text-brand-gold transition-colors">
                  Mumbai (Bandra & Worli)
                </Link>
              </li>
              <li>
                <Link href={cityPageHref('Goa')} className="block py-2 sm:py-0 hover:text-brand-gold transition-colors">
                  Goa (Assagao & Anjuna)
                </Link>
              </li>
              <li>
                <Link href={cityPageHref('Delhi NCR')} className="block py-2 sm:py-0 hover:text-brand-gold transition-colors">
                  Delhi NCR & Gurgaon
                </Link>
              </li>
              <li>
                <Link href={cityPageHref('Bangalore')} className="block py-2 sm:py-0 hover:text-brand-gold transition-colors">
                  Bangalore (Sadashivnagar)
                </Link>
              </li>
              <li>
                <Link href={cityPageHref('Hyderabad')} className="block py-2 sm:py-0 hover:text-brand-gold transition-colors">
                  Hyderabad (Jubilee Hills)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Firm & Company */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
              House & Sky
            </h4>
            <ul className="space-y-1 sm:space-y-2.5 text-xs text-white/70 font-medium">
              <li>
                <Link href="/about" className="block py-2 sm:py-0 hover:text-brand-gold transition-colors">
                  Brand Story
                </Link>
              </li>
              <li>
                <Link href="/agents" className="block py-2 sm:py-0 hover:text-brand-gold transition-colors">
                  Advisors & Team
                </Link>
              </li>
              <li>
                <Link href="/services" className="block py-2 sm:py-0 hover:text-brand-gold transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/contact" className="block py-2 sm:py-0 hover:text-brand-gold transition-colors">
                  Get In Touch
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/50 font-light">
          <p>© {new Date().getFullYear()} House & Sky Estates Ltd. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-white transition-colors cursor-pointer">RERA Compliance</span>
            <span className="hover:text-white transition-colors cursor-pointer">Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
