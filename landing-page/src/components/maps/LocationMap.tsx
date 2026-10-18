'use client'

import * as React from 'react'

// Leaflet touches `window` at import time — load only in the browser.
let L: typeof import('leaflet') | null = null
async function loadLeaflet() {
  if (L) return L
  const mod = await import('leaflet')
  await import('leaflet/dist/leaflet.css')
  L = mod
  return mod
}

type Props = {
  latitude: number
  longitude: number
  title?: string
  className?: string
  zoom?: number
}

/**
 * Read-only map showing the admin-placed pin for a project or property.
 */
export function LocationMap({ latitude, longitude, title, className = '', zoom = 15 }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<import('leaflet').Map | null>(null)

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return
    let cancelled = false
    let timer: number | undefined

    loadLeaflet().then((leaflet) => {
      if (cancelled || !containerRef.current || mapRef.current) return
      const markerIcon = leaflet.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })

      const map = leaflet.map(containerRef.current, {
        center: [latitude, longitude],
        zoom,
        scrollWheelZoom: false,
        dragging: true
      })

      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(map)

      const marker = leaflet.marker([latitude, longitude], { icon: markerIcon }).addTo(map)
      if (title) marker.bindPopup(title)

      mapRef.current = map
      timer = window.setTimeout(() => map.invalidateSize(), 100)
    })

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [latitude, longitude, title, zoom])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[240px] ${className}`}
      role="img"
      aria-label={title ? `Map location: ${title}` : 'Map location'}
    />
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
