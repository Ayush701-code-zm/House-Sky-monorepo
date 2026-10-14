const mongoose = require('mongoose');
const City = require('../models/City');
const { getPresignedUrl } = require('../services/s3Service');

const GEOCODE_TIMEOUT_MS = 5000;

// Uploaded images are stored with a pre-signed URL that expires (7 days);
// re-sign from the stored S3 key on every read so city images don't break.
async function hydrateCities(cities) {
  return Promise.all(cities.map(async (city) => {
    if (!city.imageS3Key) return city;
    const freshUrl = await getPresignedUrl(city.imageS3Key);
    return freshUrl ? { ...city, imageUrl: freshUrl } : city;
  }));
}

function toCoordinate(value, limit) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || Math.abs(num) > limit) return undefined; // undefined = invalid
  return num;
}

// Best-effort lookup of city coordinates (OpenStreetMap Nominatim, no API key)
// so "nearby" search works without the admin typing lat/lng by hand.
async function geocodeCity(name, state) {
  if (typeof fetch !== 'function') return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);
  try {
    const q = [name, state, 'India'].filter(Boolean).join(', ');
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`,
      { headers: { 'User-Agent': 'HouseAndSky/1.0 (city geocoder)' }, signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const hit = Array.isArray(data) ? data[0] : null;
    if (!hit) return null;
    const latitude = Number(hit.lat);
    const longitude = Number(hit.lon);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
  } catch (err) {
    console.warn(`City geocode failed for "${name}":`, err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Validates the body into a city payload. Returns { error } or { payload }.
function buildPayload(body, { partial = false } = {}) {
  const payload = {};

  if (!partial || body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
    if (!name || name.length > 60) return { error: 'City name is required (max 60 characters)' };
    payload.name = name;
    payload.nameKey = name.toLowerCase();
  }
  if (body.state !== undefined) payload.state = String(body.state || '').trim().slice(0, 60);
  if (body.imageUrl !== undefined) payload.imageUrl = String(body.imageUrl || '').trim();
  if (body.imageS3Key !== undefined) payload.imageS3Key = String(body.imageS3Key || '').trim();
  if (body.order !== undefined) payload.order = Number(body.order) || 0;
  if (body.isActive !== undefined) payload.isActive = Boolean(body.isActive);

  if (body.latitude !== undefined) {
    const lat = toCoordinate(body.latitude, 90);
    if (lat === undefined) return { error: 'Latitude must be a number between -90 and 90' };
    payload.latitude = lat;
  }
  if (body.longitude !== undefined) {
    const lng = toCoordinate(body.longitude, 180);
    if (lng === undefined) return { error: 'Longitude must be a number between -180 and 180' };
    payload.longitude = lng;
  }
  return { payload };
}

// Public: active cities for the website dropdowns / city cards
exports.getPublicCities = async (req, res, next) => {
  try {
    const cities = await City.find({ isActive: true })
      .select('name state imageUrl imageS3Key latitude longitude order')
      .sort({ order: 1, name: 1 })
      .lean();
    const hydrated = await hydrateCities(cities);
    res.json(hydrated.map(({ imageS3Key, ...rest }) => rest));
  } catch (error) {
    next(error);
  }
};

// Admin/Manager: all cities
exports.getAdminCities = async (req, res, next) => {
  try {
    const cities = await City.find().sort({ order: 1, name: 1 }).lean();
    res.json(await hydrateCities(cities));
  } catch (error) {
    next(error);
  }
};

exports.createCity = async (req, res, next) => {
  try {
    const { error, payload } = buildPayload(req.body || {});
    if (error) return res.status(400).json({ message: error });

    if (await City.exists({ nameKey: payload.nameKey })) {
      return res.status(409).json({ message: `${payload.name} already exists` });
    }

    if (payload.latitude == null || payload.longitude == null) {
      const coords = await geocodeCity(payload.name, payload.state);
      if (coords) Object.assign(payload, coords);
    }

    const city = await City.create({ ...payload, createdBy: req.user ? req.user._id : null });
    const [hydrated] = await hydrateCities([city.toObject()]);
    res.status(201).json(hydrated);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'This city already exists' });
    next(error);
  }
};

exports.updateCity = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'City not found' });
    }
    const city = await City.findById(req.params.id);
    if (!city) return res.status(404).json({ message: 'City not found' });

    const { error, payload } = buildPayload(req.body || {}, { partial: true });
    if (error) return res.status(400).json({ message: error });

    if (payload.nameKey && payload.nameKey !== city.nameKey && await City.exists({ nameKey: payload.nameKey })) {
      return res.status(409).json({ message: `${payload.name} already exists` });
    }

    const renamed = (payload.nameKey && payload.nameKey !== city.nameKey)
      || (payload.state !== undefined && payload.state !== city.state);
    Object.assign(city, payload);

    // Re-geocode when coordinates were cleared, or the city was renamed and the
    // admin didn't supply new coordinates in the same request.
    const coordsSent = req.body.latitude !== undefined || req.body.longitude !== undefined;
    if (city.latitude == null || city.longitude == null || (renamed && !coordsSent)) {
      const coords = await geocodeCity(city.name, city.state);
      if (coords) Object.assign(city, coords);
    }

    await city.save();
    const [hydrated] = await hydrateCities([city.toObject()]);
    res.json(hydrated);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'This city already exists' });
    next(error);
  }
};

exports.deleteCity = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'City not found' });
    }
    const city = await City.findByIdAndDelete(req.params.id);
    if (!city) return res.status(404).json({ message: 'City not found' });
    res.json({ message: `${city.name} removed` });
  } catch (error) {
    next(error);
  }
};
