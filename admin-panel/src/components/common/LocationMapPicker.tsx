import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';

const INDIA_CENTER = { lat: 22.9734, lng: 78.6569 };
const DEFAULT_ZOOM = 5;
const PIN_ZOOM = 16;
const MAPS_KEY = String((import.meta as { env?: { VITE_GOOGLE_MAPS_API_KEY?: string } }).env?.VITE_GOOGLE_MAPS_API_KEY || '');

let mapsReady: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (mapsReady) return mapsReady;
  mapsReady = new Promise((resolve, reject) => {
    const callback = 'hsInitGoogleMapsAdmin';
    const host = window as unknown as Record<string, (() => void) | undefined>;
    host[callback] = () => {
      delete host[callback];
      resolve();
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&callback=${callback}`;
    script.async = true;
    script.onerror = () => {
      mapsReady = null;
      delete host[callback];
      reject(new Error('Google Maps failed to load'));
    };
    document.head.appendChild(script);
  });
  return mapsReady;
}

export type LatLngValue = {
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (value: LatLngValue & { googleMapsUrl?: string; mapEmbedUrl?: string }) => void;
  height?: string;
  className?: string;
};

function mapsFromLatLng(lat: number, lng: number) {
  const q = `${lat},${lng}`;
  return {
    googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(q)}`,
    mapEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`
  };
}

export default function LocationMapPicker({
  latitude = null,
  longitude = null,
  onChange,
  height = '280px',
  className = ''
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [mapError, setMapError] = useState('');

  const emit = (lat: number, lng: number) => {
    onChangeRef.current({
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      ...mapsFromLatLng(lat, lng)
    });
  };

  const placeMarker = (lat: number, lng: number, fly = true) => {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
    } else {
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        draggable: true
      });
      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (!pos) return;
        emit(pos.lat(), pos.lng());
      });
      markerRef.current = marker;
    }
    if (fly) {
      map.panTo({ lat, lng });
      map.setZoom(Math.max(map.getZoom() || PIN_ZOOM, PIN_ZOOM));
    }
    emit(lat, lng);
  };

  const clearPin = () => {
    markerRef.current?.setMap(null);
    markerRef.current = null;
    onChangeRef.current({ latitude: null, longitude: null, googleMapsUrl: '', mapEmbedUrl: '' });
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!MAPS_KEY) {
      setMapError('Google Maps key is missing from admin-panel/.env');
      return;
    }
    let cancelled = false;
    const host = window as Window & { gm_authFailure?: () => void };
    const previousAuthFailure = host.gm_authFailure;
    host.gm_authFailure = () => {
      setMapError('Google rejected the Maps key. Enable Maps JavaScript API and allow this site on the key.');
    };
    const hasPin = latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude);

    loadGoogleMaps(MAPS_KEY)
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = new google.maps.Map(containerRef.current, {
          center: hasPin ? { lat: latitude as number, lng: longitude as number } : INDIA_CENTER,
          zoom: hasPin ? PIN_ZOOM : DEFAULT_ZOOM,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          scaleControl: true,
          rotateControl: true,
          clickableIcons: true,
          gestureHandling: 'greedy'
        });
        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          placeMarker(event.latLng.lat(), event.latLng.lng(), false);
        });
        mapRef.current = map;
        if (hasPin) placeMarker(latitude as number, longitude as number, false);
        window.setTimeout(() => google.maps.event.trigger(map, 'resize'), 120);
      })
      .catch((err: Error) => {
        if (!cancelled) setMapError(err.message || 'Google Maps failed to load');
      });

    return () => {
      cancelled = true;
      host.gm_authFailure = previousAuthFailure;
      if (mapRef.current) google.maps.event.clearInstanceListeners(mapRef.current);
      markerRef.current?.setMap(null);
      mapRef.current = null;
      markerRef.current = null;
    };
    // Mount once. Later pin changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (markerRef.current) {
      markerRef.current.setPosition({ lat: latitude, lng: longitude });
    } else {
      const marker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map,
        draggable: true
      });
      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (!pos) return;
        emit(pos.lat(), pos.lng());
      });
      markerRef.current = marker;
    }
    map.panTo({ lat: latitude, lng: longitude });
    if ((map.getZoom() || 0) < PIN_ZOOM) map.setZoom(PIN_ZOOM);
  }, [latitude, longitude]);

  const runSearch = async () => {
    const q = search.trim();
    if (!q || !mapRef.current) return;
    setSearching(true);
    setSearchError('');
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: q, region: 'in' }, (results, status) => {
      setSearching(false);
      if (status === 'OK' && results && results[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        placeMarker(loc.lat(), loc.lng(), true);
        return;
      }
      if (status === 'REQUEST_DENIED') {
        setSearchError('Turn on the Geocoding API for this key in Google Cloud, then search again.');
        return;
      }
      setSearchError('No location found. Try a more specific address.');
    });
  };

  const hasPin = latitude != null && longitude != null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-[#171A18]/70 font-semibold text-xs flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#0B4F3C]" />
          Pin exact location on map
        </label>
        {hasPin && (
          <button
            type="button"
            onClick={clearPin}
            className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700 inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear pin
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), runSearch())}
          placeholder="Search address, city, landmark…"
          className="flex-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] text-sm font-medium focus:outline-none focus:border-[#0B4F3C]"
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={searching || !search.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B4F3C] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#083d2e] disabled:opacity-50"
        >
          <Search className="w-3.5 h-3.5" />
          {searching ? '…' : 'Find'}
        </button>
      </div>
      {searchError && <p className="text-[11px] text-red-600 font-medium">{searchError}</p>}
      <p className="text-[10px] text-[#171A18]/50 font-medium">Click the map or drag the marker to set the pin. This location shows on the public website.</p>

      <div className="relative">
        <div
          ref={containerRef}
          className="w-full rounded-xl overflow-hidden border border-[#0B4F3C]/20 z-0"
          style={{ height }}
        />
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 px-6 text-center text-xs font-semibold text-[#171A18]">
            {mapError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#171A18]/70">
        <div className="bg-[#FDFCF0] border border-[#0B4F3C]/10 rounded-lg px-2.5 py-1.5">
          Lat: {hasPin ? Number(latitude).toFixed(6) : '—'}
        </div>
        <div className="bg-[#FDFCF0] border border-[#0B4F3C]/10 rounded-lg px-2.5 py-1.5">
          Lng: {hasPin ? Number(longitude).toFixed(6) : '—'}
        </div>
      </div>
    </div>
  );
}
