'use client'

import * as React from 'react'

type Props = {
  latitude: number
  longitude: number
  title?: string
  className?: string
  zoom?: number
}

/**
 * Read-only Google Map for a project or property pin.
 * Key lives in landing-page/.env as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 * Copy that line into the production server env before the production build.
 */
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

let mapsReady: Promise<void> | null = null

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Google Maps loads in the browser only'))
  if (window.google?.maps?.Map) return Promise.resolve()
  if (mapsReady) return mapsReady
  mapsReady = new Promise((resolve, reject) => {
    const callback = 'hsInitGoogleMaps'
    const host = window as unknown as Record<string, (() => void) | undefined>
    host[callback] = () => {
      delete host[callback]
      resolve()
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&callback=${callback}`
    script.async = true
    script.onerror = () => {
      mapsReady = null
      delete host[callback]
      reject(new Error('Google Maps failed to load'))
    }
    document.head.appendChild(script)
  })
  return mapsReady
}

export function LocationMap({ latitude, longitude, title, className = '', zoom = 16 }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (!containerRef.current) return
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return
    if (!MAPS_KEY) {
      setError('Google Maps key is missing from landing-page/.env')
      return
    }
    let cancelled = false
    let map: google.maps.Map | null = null
    const host = window as Window & { gm_authFailure?: () => void }
    const previousAuthFailure = host.gm_authFailure
    host.gm_authFailure = () => {
      setError('Google rejected the Maps key. Enable Maps JavaScript API and allow this site on the key.')
    }

    loadGoogleMaps(MAPS_KEY)
      .then(() => {
        if (cancelled || !containerRef.current) return
        map = new google.maps.Map(containerRef.current, {
          center: { lat: latitude, lng: longitude },
          zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          scaleControl: true,
          rotateControl: true,
          clickableIcons: true,
          gestureHandling: 'greedy'
        })
        const marker = new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map,
          title: title || 'Location'
        })
        if (title) {
          const info = new google.maps.InfoWindow({ content: title })
          marker.addListener('click', () => info.open({ map: map!, anchor: marker }))
        }
        window.setTimeout(() => {
          if (map) google.maps.event.trigger(map, 'resize')
        }, 120)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Google Maps failed to load')
      })

    return () => {
      cancelled = true
      host.gm_authFailure = previousAuthFailure
      if (map) google.maps.event.clearInstanceListeners(map)
    }
  }, [latitude, longitude, title, zoom])

  return (
    <div className={`relative w-full h-full min-h-[240px] ${className}`}>
      <div
        ref={containerRef}
        className="w-full h-full min-h-[240px]"
        role="img"
        aria-label={title ? `Map location: ${title}` : 'Map location'}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/95 px-6 text-center text-sm font-semibold text-brand-charcoal">
          {error}
        </div>
      )}
    </div>
  )
}

export function hasValidCoords(lat?: number | null, lng?: number | null): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}
