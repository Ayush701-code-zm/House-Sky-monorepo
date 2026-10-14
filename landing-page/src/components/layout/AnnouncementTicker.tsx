'use client'

import * as React from 'react'
import { Megaphone } from 'lucide-react'
import { getApiBaseUrl } from '@/utils/api'

const DEFAULT_ANNOUNCEMENT = 'महत्वपूर्ण सूचना: धोलरा SIR एवं नोएडा स्मार्ट सिटी टाownship में नए प्लॉट्स की रजिस्ट्री चालू है। साइट विज़िट बुक करने के लिए संपर्क करें: +91 93112 27789 | व्हाट्सएप: +91 92899 27527'

export function AnnouncementTicker() {
  const [announcement, setAnnouncement] = React.useState<string>(DEFAULT_ANNOUNCEMENT)
  const [isActive, setIsActive] = React.useState<boolean>(true)
  const [loading, setLoading] = React.useState<boolean>(true)

  React.useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const baseUrl = getApiBaseUrl()
        const res = await fetch(`${baseUrl}/public/announcement`)
        if (res.ok) {
          const data = await res.json()
          if (data.announcement) setAnnouncement(data.announcement)
          if (typeof data.isActive === 'boolean') setIsActive(data.isActive)
        }
      } catch (err) {
        console.error('Failed to fetch public announcement ticker:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnnouncement()
  }, [])

  if (!isActive || !announcement || announcement.trim() === '') {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C9A96E] text-[#171A18] border-b border-[#B8860B]/30 text-xs shadow-md overflow-hidden relative font-sans flex items-center h-9 sm:h-10 z-10">
      {/* Static Badge on the left */}
      <div className="bg-gradient-to-r from-[#063B2D] to-[#0B4F3C] text-amber-300 font-extrabold px-3 sm:px-4 py-2 text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 z-10 shadow-md border-r border-[#C9A96E]/50">
        <Megaphone className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
        <span className="hidden sm:inline whitespace-nowrap font-bold text-amber-200">महत्वपूर्ण सूचना</span>
      </div>

      {/* Marquee scrolling container */}
      <div className="relative flex-1 overflow-hidden h-full flex items-center">
        <div className="animate-marquee-continuous flex items-center whitespace-nowrap w-max cursor-default">
          <span className="inline-flex items-center gap-6 px-4 text-xs font-bold text-[#171A18] tracking-wide">
            <span>{announcement}</span>
            <span className="text-[#063B2D] font-black">◆</span>
          </span>
          <span className="inline-flex items-center gap-6 px-4 text-xs font-bold text-[#171A18] tracking-wide">
            <span>{announcement}</span>
            <span className="text-[#063B2D] font-black">◆</span>
          </span>
          <span className="inline-flex items-center gap-6 px-4 text-xs font-bold text-[#171A18] tracking-wide">
            <span>{announcement}</span>
            <span className="text-[#063B2D] font-black">◆</span>
          </span>
          <span className="inline-flex items-center gap-6 px-4 text-xs font-bold text-[#171A18] tracking-wide">
            <span>{announcement}</span>
            <span className="text-[#063B2D] font-black">◆</span>
          </span>
        </div>
      </div>
    </div>
  )
}
