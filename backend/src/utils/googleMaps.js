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

function applyProjectMaps(payload = {}) {
  const googleMapsUrl = String(payload.googleMapsUrl || '').trim();
  const mapEmbedUrl = String(payload.mapEmbedUrl || '').trim() || deriveMapEmbedUrl(googleMapsUrl);
  return { googleMapsUrl, mapEmbedUrl };
}

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
  clampPercent,
  isValidPercent
};
