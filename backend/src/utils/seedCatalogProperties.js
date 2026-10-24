/**
 * Upsert a public catalog so every property type, budget band, and listing
 * intent on /properties has at least one result. Existing slugs are updated
 * in place; projects and plots are left alone.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('../models/Property');
const City = require('../models/City');

const img = (id) =>
  `https://images.unsplash.com/${id}?w=1600&q=80&auto=format&fit=crop`;

const PHOTOS = {
  villa: img('photo-1613490493576-7fde63acd811'),
  villa2: img('photo-1600596542815-ffad4c1539a9'),
  apartment: img('photo-1502672260266-1c1ef2d93688'),
  apartment2: img('photo-1560448204-e02f11c3d0e2'),
  studio: img('photo-1522708323590-d24dbb6b0267'),
  commercial: img('photo-1486406146926-c627a92ad1ab'),
  showroom: img('photo-1441986300917-64674bd600d8'),
  plot: img('photo-1500382017468-9049fed747ef'),
  land: img('photo-1464146072230-91cabc968266'),
};

const CITIES = {
  Dholera: { state: 'Gujarat', lat: 22.248, lng: 72.19 },
  Noida: { state: 'Uttar Pradesh', lat: 28.5355, lng: 77.391 },
  Bhopal: { state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  Narmadapuram: { state: 'Madhya Pradesh', lat: 22.7478, lng: 77.727 },
  Ahmedabad: { state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  'Delhi NCR': { state: 'Delhi', lat: 28.6139, lng: 77.209 },
  Gurgaon: { state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  Mumbai: { state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  Bangalore: { state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  Hyderabad: { state: 'Telangana', lat: 17.385, lng: 78.4867 },
  Pune: { state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  Indore: { state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  Jaipur: { state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  Lucknow: { state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  Surat: { state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  Kolkata: { state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  Chennai: { state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  Goa: { state: 'Goa', lat: 15.4909, lng: 73.8278 },
  Chandigarh: { state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  Ayodhya: { state: 'Uttar Pradesh', lat: 26.7922, lng: 82.1998 },
  Thane: { state: 'Maharashtra', lat: 19.2183, lng: 72.9781 },
  'Navi Mumbai': { state: 'Maharashtra', lat: 19.033, lng: 73.0297 },
  Nagpur: { state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  Ludhiana: { state: 'Punjab', lat: 30.901, lng: 75.8573 },
  Patna: { state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  Ujjain: { state: 'Madhya Pradesh', lat: 23.1765, lng: 75.7885 },
  Gwalior: { state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828 },
  Satpura: { state: 'Madhya Pradesh', lat: 22.5, lng: 78.0 },
};

/** price in INR. Bands match landing BUDGET_OPTIONS. */
const BANDS = {
  UNDER_50L: 4200000,
  '50L_1CR': 7800000,
  '1CR_3CR': 18500000,
  '3CR_5CR': 42000000,
  ABOVE_5CR: 185000000,
};

function geoFor(city, extra = {}) {
  return CITIES[city] || extra[city] || { state: '', lat: 20.5937, lng: 78.9629 };
}

function listing({
  slug, title, tagline, propertyType, listingType = 'SALE', city, area,
  price, photo, bedrooms = 0, bathrooms = 0, areaSqft = 0, featured = false,
  extraGeo = {},
}) {
  const geo = geoFor(city, extraGeo);
  const sqft = areaSqft || (propertyType === 'VILLA' ? 4200 : propertyType === 'APARTMENT' ? 1800 : 2400);
  return {
    slug,
    title,
    tagline,
    description: `${title} in ${area}, ${city}. A verified House & Sky listing with clear title and ready documentation.`,
    propertyType,
    listingType,
    location: area,
    city,
    state: geo.state,
    area,
    address: `${area}, ${city}`,
    price,
    pricePerSqft: Math.round(price / sqft),
    priceRange: '',
    areaSqft: sqft,
    bedrooms,
    bathrooms,
    parkingSpaces: bedrooms > 0 ? Math.min(bedrooms, 3) : 2,
    highlights: ['Clear title', 'Gated access', 'Wide approach road'],
    amenities: ['24/7 Security', 'Power backup', 'Landscaped common areas'],
    features: [`${city} location`, area],
    heroImage: photo,
    gallery: [{ url: photo, caption: title }],
    latitude: geo.lat,
    longitude: geo.lng,
    status: 'AVAILABLE',
    isFeatured: featured,
    isPublished: true,
    approvalStatus: 'APPROVED',
    source: 'ADMIN',
    legalInfo: {
      reraNumber: `RERA-${slug.slice(0, 12).toUpperCase()}`,
      titleType: 'Freehold',
      approvalAuthority: geo.state,
    },
  };
}

const TYPES = [
  { type: 'VILLA', photo: PHOTOS.villa, beds: 4, baths: 4, label: 'Villa' },
  { type: 'APARTMENT', photo: PHOTOS.apartment, beds: 3, baths: 3, label: 'Apartment' },
  { type: 'STUDIO_APARTMENT', photo: PHOTOS.studio, beds: 1, baths: 1, label: 'Studio' },
  { type: 'COMMERCIAL', photo: PHOTOS.commercial, beds: 0, baths: 2, label: 'Commercial' },
  { type: 'SHOWROOM', photo: PHOTOS.showroom, beds: 0, baths: 1, label: 'Showroom' },
  { type: 'RESIDENTIAL_PLOT', photo: PHOTOS.plot, beds: 0, baths: 0, label: 'Plot' },
  { type: 'LAND', photo: PHOTOS.land, beds: 0, baths: 0, label: 'Land' },
];

const BAND_ORDER = ['UNDER_50L', '50L_1CR', '1CR_3CR', '3CR_5CR', 'ABOVE_5CR'];
const AREAS = {
  Goa: ['Assagao', 'Anjuna', 'Panaji', 'Candolim'],
  Mumbai: ['Bandra West', 'Worli', 'Juhu', 'Lower Parel'],
  'Delhi NCR': ['Golf Course Road', 'DLF Phase 2', 'Sohna Road', 'Aerocity'],
  Bangalore: ['Sadashivnagar', 'Indiranagar', 'Whitefield', 'Koramangala'],
  Hyderabad: ['Jubilee Hills', 'Banjara Hills', 'Gachibowli', 'Hitech City'],
  Pune: ['Koregaon Park', 'Kalyani Nagar', 'Baner', 'Kharadi'],
  Noida: ['Sector 80', 'Sector 150', 'Sector 62', 'Sector 137'],
  Dholera: ['Activation Area', 'TP Scheme 1', 'Knowledge City'],
  Bhopal: ['Arera Colony', 'Kolar Road', 'MP Nagar'],
  Ahmedabad: ['Bodakdev', 'Thaltej', 'SG Highway'],
  Gurgaon: ['Golf Course Road', 'Sector 57', 'Sohna Road'],
  Jaipur: ['C-Scheme', 'Vaishali Nagar', 'Malviya Nagar'],
};

function slugCity(city) {
  return String(city).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function areaFor(city, n) {
  const list = AREAS[city] || [`${city} Central`];
  return list[n % list.length];
}

function buildCatalog(cityNames, extraGeo) {
  const rows = [];
  cityNames.forEach((city) => {
    TYPES.forEach((spec, typeIndex) => {
      BAND_ORDER.forEach((band, bandIndex) => {
        const area = city === 'Goa' && spec.type === 'VILLA' && band === 'ABOVE_5CR'
          ? 'Assagao'
          : areaFor(city, typeIndex + bandIndex);
        rows.push(listing({
          slug: `catalog-${spec.type.toLowerCase()}-${band.toLowerCase()}-${slugCity(city)}`,
          title: `${spec.label} · ${area}`,
          tagline: `${spec.label} in ${city}`,
          propertyType: spec.type,
          city,
          area,
          price: BANDS[band] + typeIndex * 50000,
          photo: spec.photo,
          bedrooms: spec.beds,
          bathrooms: spec.baths,
          featured: band === 'ABOVE_5CR',
          extraGeo,
        }));
      });

      ['RENT', 'LEASE'].forEach((intent) => {
        const area = areaFor(city, typeIndex);
        rows.push(listing({
          slug: `catalog-${spec.type.toLowerCase()}-${intent.toLowerCase()}-${slugCity(city)}`,
          title: `${spec.label} for ${intent === 'RENT' ? 'Rent' : 'Lease'} · ${area}`,
          tagline: `${intent === 'RENT' ? 'Monthly rental' : 'Long lease'} in ${city}`,
          propertyType: spec.type,
          listingType: intent,
          city,
          area,
          price: intent === 'RENT' ? 180000 + typeIndex * 25000 : 2200000 + typeIndex * 150000,
          photo: spec.photo,
          bedrooms: spec.beds,
          bathrooms: spec.baths,
          extraGeo,
        }));
      });
    });
  });
  return rows;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(process.env.MONGODB_URI);
  const dbCities = await City.find({ isActive: { $ne: false } }).select('name state latitude longitude').lean();
  const extraGeo = {};
  const names = new Set(Object.keys(CITIES));
  dbCities.forEach((city) => {
    if (!city.name) return;
    names.add(city.name);
    extraGeo[city.name] = {
      state: city.state || '',
      lat: city.latitude || 20.5937,
      lng: city.longitude || 78.9629,
    };
  });
  const rows = buildCatalog([...names], extraGeo);
  const ops = rows.map((row) => ({
    updateOne: {
      filter: { slug: row.slug },
      update: { $set: row },
      upsert: true,
    },
  }));
  for (let i = 0; i < ops.length; i += 200) {
    await Property.bulkWrite(ops.slice(i, i + 200), { ordered: false });
  }
  const byCity = await Property.aggregate([
    { $match: { slug: /^catalog-/, approvalStatus: 'APPROVED', isPublished: { $ne: false } } },
    { $group: { _id: '$city', n: { $sum: 1 } } },
  ]);
  const missing = [...names].filter((name) => !byCity.some((row) => String(row._id).toLowerCase() === name.toLowerCase()));
  console.log(`Upserted ${rows.length} catalog listings across ${names.size} cities`);
  console.log(`Cities with listings: ${byCity.length}`);
  console.log(missing.length ? `Missing: ${missing.join(', ')}` : 'Every city has listings');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
