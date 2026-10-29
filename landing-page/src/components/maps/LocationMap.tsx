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
const STREET_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
/** Esri returns a "Map data not yet available" tile past this level for this region. */
const SATELLITE_MAX_ZOOM = 18
const STREET_MAX_ZOOM = 19

export function LocationMap({ latitude, longitude, title, className = '', zoom = 15 }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<import('leaflet').Map | null>(null)
  const layersRef = React.useRef<{ street: import('leaflet').TileLayer; satellite: import('leaflet').TileLayer } | null>(null)
  const [basemap, setBasemap] = React.useState<'map' | 'satellite'>('map')
  const basemapRef = React.useRef(basemap)
  basemapRef.current = basemap

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
        maxZoom: STREET_MAX_ZOOM,
        scrollWheelZoom: false,
        dragging: true
      })

      const street = leaflet.tileLayer(STREET_TILES, {
        attribution: '&copy; OpenStreetMap',
        maxZoom: STREET_MAX_ZOOM
      }).addTo(map)
      const satellite = leaflet.tileLayer(SATELLITE_TILES, {
        attribution: 'Tiles &copy; Esri',
        maxZoom: SATELLITE_MAX_ZOOM,
        maxNativeZoom: SATELLITE_MAX_ZOOM
      })
      layersRef.current = { street, satellite }
      const cap = basemapRef.current === 'satellite' ? SATELLITE_MAX_ZOOM : STREET_MAX_ZOOM
      map.setMaxZoom(cap)
      if (basemapRef.current === 'satellite') {
        map.removeLayer(street)
        satellite.addTo(map)
      }

      const marker = leaflet.marker([latitude, longitude], { icon: markerIcon }).addTo(map)
      if (title) marker.bindPopup(title)

      mapRef.current = map
      map.on('zoomend', () => {
        const center = map.getCenter()
        // #region agent log
        fetch('http://127.0.0.1:7420/ingest/0655f98e-3729-4804-b6a0-f784ef6ed12a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e67702'},body:JSON.stringify({sessionId:'e67702',location:'LocationMap.tsx:zoomend',message:'map zoom ended',data:{zoom:map.getZoom(),maxZoom:map.getMaxZoom(),basemap:basemapRef.current,lat:Number(center.lat.toFixed(5)),lng:Number(center.lng.toFixed(5)),pinLat:latitude,pinLng:longitude},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
        // #endregion
      })
      timer = window.setTimeout(() => map.invalidateSize(), 100)
    })

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
      mapRef.current?.remove()
      mapRef.current = null
      layersRef.current = null
    }
  }, [latitude, longitude, title, zoom])

  React.useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map || !layers) return
    const cap = basemap === 'satellite' ? SATELLITE_MAX_ZOOM : STREET_MAX_ZOOM
    map.setMaxZoom(cap)
    if (map.getZoom() > cap) map.setZoom(cap)
    if (basemap === 'satellite') {
      if (map.hasLayer(layers.street)) map.removeLayer(layers.street)
      if (!map.hasLayer(layers.satellite)) layers.satellite.addTo(map)
    } else {
      if (map.hasLayer(layers.satellite)) map.removeLayer(layers.satellite)
      if (!map.hasLayer(layers.street)) layers.street.addTo(map)
    }
    // #region agent log
    fetch('http://127.0.0.1:7420/ingest/0655f98e-3729-4804-b6a0-f784ef6ed12a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e67702'},body:JSON.stringify({sessionId:'e67702',location:'LocationMap.tsx:basemap',message:'basemap zoom cap',data:{basemap,zoom:map.getZoom(),maxZoom:map.getMaxZoom(),cap},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
    // #endregion
  }, [basemap])

  return (
    <div className={`relative w-full h-full min-h-[240px] ${className}`}>
      <div className="absolute top-2 right-2 z-[500] flex overflow-hidden rounded-lg border border-black/10 bg-white shadow-md">
        <button
          type="button"
          onClick={() => setBasemap('map')}
          className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${basemap === 'map' ? 'bg-brand-green text-white' : 'text-brand-charcoal'}`}
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => setBasemap('satellite')}
          className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${basemap === 'satellite' ? 'bg-brand-green text-white' : 'text-brand-charcoal'}`}
        >
          Satellite
        </button>
      </div>
      <div
        ref={containerRef}
        className="w-full h-full min-h-[240px]"
        role="img"
        aria-label={title ? `Map location: ${title}` : 'Map location'}
      />
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
