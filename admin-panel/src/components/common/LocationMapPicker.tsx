import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, X } from 'lucide-react';

// Vite breaks Leaflet's default icon paths — point at CDN assets.
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const INDIA_CENTER: [number, number] = [22.9734, 78.6569];
const DEFAULT_ZOOM = 5;
const PIN_ZOOM = 15;

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
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const setPin = (lat: number, lng: number, fly = true) => {
    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current?.getLatLng();
        if (!pos) return;
        const derived = mapsFromLatLng(pos.lat, pos.lng);
        onChangeRef.current({
          latitude: Number(pos.lat.toFixed(6)),
          longitude: Number(pos.lng.toFixed(6)),
          ...derived
        });
      });
    }

    if (fly) map.setView([lat, lng], Math.max(map.getZoom(), PIN_ZOOM));
    const derived = mapsFromLatLng(lat, lng);
    onChangeRef.current({
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      ...derived
    });
  };

  const clearPin = () => {
    if (markerRef.current && mapRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    onChangeRef.current({ latitude: null, longitude: null, googleMapsUrl: '', mapEmbedUrl: '' });
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const hasPin = latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude);
    const map = L.map(containerRef.current, {
      center: hasPin ? [latitude!, longitude!] : INDIA_CENTER,
      zoom: hasPin ? PIN_ZOOM : DEFAULT_ZOOM,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      setPin(e.latlng.lat, e.latlng.lng, false);
    });

    mapRef.current = map;

    if (hasPin) {
      markerRef.current = L.marker([latitude!, longitude!], { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current?.getLatLng();
        if (!pos) return;
        const derived = mapsFromLatLng(pos.lat, pos.lng);
        onChangeRef.current({
          latitude: Number(pos.lat.toFixed(6)),
          longitude: Number(pos.lng.toFixed(6)),
          ...derived
        });
      });
    }

    // Leaflet needs a layout pass when mounted inside modals.
    setTimeout(() => map.invalidateSize(), 80);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once; props synced below
  }, []);

  // Sync external lat/lng into an already-mounted map (edit forms).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current?.getLatLng();
          if (!pos) return;
          const derived = mapsFromLatLng(pos.lat, pos.lng);
          onChangeRef.current({
            latitude: Number(pos.lat.toFixed(6)),
            longitude: Number(pos.lng.toFixed(6)),
            ...derived
          });
        });
      }
      map.setView([latitude, longitude], Math.max(map.getZoom(), PIN_ZOOM));
    }
  }, [latitude, longitude]);

  const runSearch = async () => {
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    setSearchError('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setSearchError('No location found. Try a more specific address.');
        return;
      }
      const lat = Number(data[0].lat);
      const lng = Number(data[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setSearchError('Invalid search result.');
        return;
      }
      setPin(lat, lng, true);
    } catch {
      setSearchError('Search failed. Check your network and try again.');
    } finally {
      setSearching(false);
    }
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

      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-[#0B4F3C]/20 z-0"
        style={{ height }}
      />

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
