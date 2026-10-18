const PERCENT_MIN = 0;
const PERCENT_MAX = 100;

function deriveMapEmbedUrl(googleMapsUrl) {
  if (!googleMapsUrl || typeof googleMapsUrl !== 'string') return '';
  const url = googleMapsUrl.trim();
  if (!url) return '';
  if (url.includes('/embed') || url.includes('output=embed')) return url;

  const queryMatch = url.match(/[?&]q=([^&]+)/i);
  const placeMatch = url.match(/\/place\/([^/]+)/i);
  const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  let query = url;

  if (queryMatch) {
    try {
      query = decodeURIComponent(queryMatch[1].replace(/\+/g, ' '));
    } catch {
      query = queryMatch[1];
    }
  } else if (placeMatch) {
    try {
      query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    } catch {
      query = placeMatch[1];
    }
  } else if (coordMatch) {
    query = `${coordMatch[1]},${coordMatch[2]}`;
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
}

/** Parse and validate a latitude/longitude pair. Returns nulls if either is missing/invalid. */
function parseLatLng(payload = {}) {
  const latRaw = payload.latitude;
  const lngRaw = payload.longitude;
  if (latRaw === undefined && lngRaw === undefined) {
    return { touched: false, latitude: undefined, longitude: undefined };
  }
  if (latRaw === null || lngRaw === null || latRaw === '' || lngRaw === '') {
    return { touched: true, latitude: null, longitude: null };
  }
  const latitude = Number(latRaw);
  const longitude = Number(lngRaw);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { touched: true, latitude: null, longitude: null };
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { touched: true, latitude: null, longitude: null };
  }
  return { touched: true, latitude, longitude };
}

function mapsFromLatLng(latitude, longitude) {
  if (latitude == null || longitude == null) {
    return { googleMapsUrl: '', mapEmbedUrl: '' };
  }
  const q = `${latitude},${longitude}`;
  return {
    googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(q)}`,
    mapEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`
  };
}

function applyProjectMaps(payload = {}) {
  const coords = parseLatLng(payload);
  // Prefer explicit pin coordinates when provided — derive Google URLs from them.
  if (coords.touched && coords.latitude != null && coords.longitude != null) {
    const derived = mapsFromLatLng(coords.latitude, coords.longitude);
    const googleMapsUrl = String(payload.googleMapsUrl || '').trim() || derived.googleMapsUrl;
    const mapEmbedUrl = String(payload.mapEmbedUrl || '').trim() || derived.mapEmbedUrl;
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      googleMapsUrl,
      mapEmbedUrl
    };
  }
  if (coords.touched && coords.latitude == null) {
    const googleMapsUrl = String(payload.googleMapsUrl || '').trim();
    const mapEmbedUrl = String(payload.mapEmbedUrl || '').trim() || deriveMapEmbedUrl(googleMapsUrl);
    return { latitude: null, longitude: null, googleMapsUrl, mapEmbedUrl };
  }

  const googleMapsUrl = String(payload.googleMapsUrl || '').trim();
  const mapEmbedUrl = String(payload.mapEmbedUrl || '').trim() || deriveMapEmbedUrl(googleMapsUrl);
  return { googleMapsUrl, mapEmbedUrl };
}

const applyPropertyMaps = applyProjectMaps;

function clampPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.min(PERCENT_MAX, Math.max(PERCENT_MIN, num));
}

function isValidPercent(value) {
  return clampPercent(value) !== null;
}

module.exports = {
  deriveMapEmbedUrl,
  applyProjectMaps,
  applyPropertyMaps,
  parseLatLng,
  mapsFromLatLng,
  clampPercent,
  isValidPercent
};
