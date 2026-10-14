'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Sparkles, PhoneCall, ArrowUpRight } from 'lucide-react'

export function WelcomeModal() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Show once per browser session, and never when the visitor arrived with a
    // search/filter or a deep link — the popup would cover the results they asked for.
    const SEEN_KEY = 'hs-welcome-seen'
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return
    } catch {}
    if (window.location.search || window.location.hash) return

    const timer = setTimeout(() => {
      setIsOpen(true)
      try {
        sessionStorage.setItem(SEEN_KEY, '1')
      } catch {}
    }, 600)

    return () => clearTimeout(timer)
  }, [])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal Content Box */}
      <div className="relative z-10 w-full max-w-2xl bg-[#092219] border border-[#C9A96E]/50 rounded-3xl shadow-2xl overflow-hidden my-auto transform transition-all duration-300 scale-100">

        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-20 p-2.5 bg-black/60 hover:bg-black/90 text-white hover:text-[#C9A96E] rounded-full border border-white/20 transition-all duration-200 cursor-pointer shadow-lg group"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Header Tag */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white py-2 px-6 text-center text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-100 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Exclusive Launch • House & Sky Presentation</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-100 animate-spin" style={{ animationDuration: '4s' }} />
        </div>

        {/* Featured Image */}
        <div className="relative w-full aspect-[16/10] bg-[#092219] overflow-hidden">
          <Image
            src="/images/krishna-lok-modal.png"
            alt="Krishna Lok Studio Apartment By House & Sky"
            fill
            priority
            className="object-contain p-3 sm:p-5"
          />
        </div>

        {/* Modal Buttons */}
        <div className="p-4 sm:p-6 bg-[#061A13] border-t border-[#C9A96E]/20 text-center relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs uppercase tracking-[0.16em] rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 border border-emerald-400/30 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-emerald-200" />
              <span>Book Site Visit / Enquire</span>
            </Link>

            <Link
              href="/projects"
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs uppercase tracking-[0.16em] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore All Projects</span>
              <ArrowUpRight className="w-4 h-4 text-amber-300" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
