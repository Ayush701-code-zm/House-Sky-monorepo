const mongoose = require('mongoose');
const Property = require('../models/Property');
const { PROPERTY_TYPES, LISTING_TYPES, PROPERTY_STATUSES } = require('../models/Property');
const { notifyAdmins } = require('../services/notificationService');
const { queryString, containsRegex } = require('../utils/queryUtils');
const { getPresignedUrl } = require('../services/s3Service');

const SLUG_FALLBACK = 'property';

function slugify(value) {
  const raw = String(value || '').toLowerCase().trim();
  const slug = raw.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return slug || SLUG_FALLBACK;
}

async function uniqueSlug(baseTitle, excludeId) {
  const base = slugify(baseTitle);
  let candidate = base;
  let suffix = 0;

  while (true) {
    const filter = { slug: candidate };
    if (excludeId) filter._id = { $ne: excludeId };
    const existing = await Property.findOne(filter).select('_id');
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function sanitizeGallery(gallery) {
  if (!Array.isArray(gallery)) return [];
  return gallery
    .filter((item) => item && item.url)
    .map((item) => ({
      url: String(item.url),
      s3Key: item.s3Key ? String(item.s3Key) : '',
      caption: item.caption ? String(item.caption) : ''
    }));
}

// Gallery images are saved with an expiring pre-signed URL plus their S3 key;
// re-sign on read so listing images don't break after the URL expires.
async function withFreshGallery(property) {
  if (!property) return property;
  const p = typeof property.toObject === 'function' ? property.toObject() : { ...property };
  if (Array.isArray(p.gallery) && p.gallery.some((g) => g && g.s3Key)) {
    p.gallery = await Promise.all(p.gallery.map(async (g) => {
      if (!g || !g.s3Key) return g;
      const freshUrl = await getPresignedUrl(g.s3Key);
      return freshUrl ? { ...g, url: freshUrl } : g;
    }));
  }
  return p;
}

function toPublicProperty(property) {
  if (!property) return property;
  const {
    kycInfo,
    createdBy,
    rejectionReason,
    source,
    __v,
    ...safe
  } = property;
  return safe;
}

function buildPropertyPayload(body, slug) {
  const { applyPropertyMaps } = require('../utils/googleMaps');
  const maps = applyPropertyMaps(body);
  return {
    title: body.title,
    slug,
    tagline: body.tagline || '',
    description: body.description || '',
    propertyType: PROPERTY_TYPES.includes(body.propertyType) ? body.propertyType : 'RESIDENTIAL_PLOT',
    listingType: LISTING_TYPES.includes(body.listingType) ? body.listingType : 'SALE',
    projectId: body.projectId && isValidObjectId(body.projectId) ? body.projectId : null,
    location: body.location || '',
    city: body.city || '',
    state: body.state || '',
    area: body.area || '',
    address: body.address || '',
    village: body.village || '',
    surveyNumber: body.surveyNumber || '',
    price: Number(body.price) || 0,
    pricePerSqft: Number(body.pricePerSqft) || 0,
    priceRange: body.priceRange || '',
    areaSqft: Number(body.areaSqft) || 0,
    areaSqYrd: Number(body.areaSqYrd) || 0,
    dimensions: body.dimensions || '',
    bedrooms: Number(body.bedrooms) || 0,
    bathrooms: Number(body.bathrooms) || 0,
    parkingSpaces: Number(body.parkingSpaces) || 0,
    highlights: Array.isArray(body.highlights) ? body.highlights.filter(Boolean) : [],
    amenities: Array.isArray(body.amenities) ? body.amenities.filter(Boolean) : [],
    features: Array.isArray(body.features) ? body.features.filter(Boolean) : [],
    heroImage: body.heroImage || '',
    gallery: sanitizeGallery(body.gallery),
    floorPlanUrl: body.floorPlanUrl || '',
    brochureUrl: body.brochureUrl || '',
    videoUrl: body.videoUrl || '',
    latitude: maps.latitude !== undefined ? maps.latitude : (body.latitude == null || body.latitude === '' ? null : Number(body.latitude)),
    longitude: maps.longitude !== undefined ? maps.longitude : (body.longitude == null || body.longitude === '' ? null : Number(body.longitude)),
    googleMapsUrl: maps.googleMapsUrl || body.googleMapsUrl || '',
    mapEmbedUrl: maps.mapEmbedUrl || body.mapEmbedUrl || '',
    contactPhone: body.contactPhone || '',
    contactEmail: body.contactEmail || '',
    status: PROPERTY_STATUSES.includes(body.status) ? body.status : 'AVAILABLE',
    isFeatured: Boolean(body.isFeatured),
    isPublished: body.isPublished === undefined ? true : Boolean(body.isPublished),
    legalInfo: {
      reraNumber: body.legalInfo?.reraNumber || body.reraNumber || '',
      titleType: body.legalInfo?.titleType || body.titleType || 'Freehold',
      approvalAuthority: body.legalInfo?.approvalAuthority || body.approvalAuthority || ''
    }
  };
}

exports.getProperties = async (req, res, next) => {
  try {
    const projectId = queryString(req.query.projectId);
    const propertyType = queryString(req.query.propertyType);
    const status = queryString(req.query.status);
    const search = queryString(req.query.search);
    const filter = {};

    if (projectId && isValidObjectId(projectId)) filter.projectId = projectId;
    if (propertyType) filter.propertyType = propertyType;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: containsRegex(search) },
        { city: containsRegex(search) },
        { location: containsRegex(search) }
      ];
    }

    const properties = await Property.find(filter)
      .populate('projectId', 'name code location city')
      .sort({ createdAt: -1 });

    res.json(await Promise.all(properties.map(withFreshGallery)));
  } catch (error) {
    next(error);
  }
};

exports.getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id).populate('projectId', 'name code location city bannerImage');
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json(await withFreshGallery(property));
  } catch (error) {
    next(error);
  }
};

exports.createProperty = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Property title is required' });

    const slug = await uniqueSlug(req.body.slug || title);
    const payload = buildPropertyPayload(req.body, slug);
    if (req.user) payload.createdBy = req.user._id;

    const property = await Property.create(payload);
    const populated = await Property.findById(property._id).populate('projectId', 'name code location');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

exports.updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Property.findById(id);
    if (!existing) return res.status(404).json({ message: 'Property not found' });

    const nextTitle = req.body.title || existing.title;
    const slug = req.body.slug && req.body.slug !== existing.slug
      ? await uniqueSlug(req.body.slug, existing._id)
      : existing.slug;

    const payload = buildPropertyPayload({ ...existing.toObject(), ...req.body, title: nextTitle }, slug);
    const property = await Property.findByIdAndUpdate(id, payload, { new: true })
      .populate('projectId', 'name code location');

    res.json(property);
  } catch (error) {
    next(error);
  }
};

exports.deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await Property.findByIdAndDelete(id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const APPROVAL_FILTER = {
  $or: [
    { approvalStatus: 'APPROVED' },
    { approvalStatus: { $exists: false } }
  ]
};

exports.getPublicProperties = async (req, res, next) => {
  try {
    const q = {};
    ['projectId', 'propertyType', 'listingType', 'city', 'location', 'search', 'minPrice',
      'maxPrice', 'bedrooms', 'featured', 'onlyVerified', 'sort'].forEach((key) => {
      q[key] = queryString(req.query[key]);
    });
    const {
      projectId,
      propertyType,
      listingType,
      city,
      location,
      search,
      minPrice,
      maxPrice,
      bedrooms,
      featured,
      onlyVerified,
      sort
    } = q;

    // Approval filter lives in $and so a later search $or can't overwrite it.
    const filter = { isPublished: { $ne: false }, $and: [APPROVAL_FILTER] };

    if (projectId && isValidObjectId(projectId)) filter.projectId = projectId;
    
    if (propertyType && propertyType !== 'ALL') {
      filter.propertyType = propertyType;
    }
    
    if (listingType && listingType !== 'ALL') {
      const lUpper = String(listingType).toUpperCase();
      if (lUpper === 'SALE' || lUpper === 'BUY') {
        filter.listingType = { $in: ['SALE', 'BUY', 'Sale', 'Buy'] };
      } else {
        filter.listingType = listingType;
      }
    }

    if (city && city !== 'All Cities' && city !== 'ALL') {
      filter.city = containsRegex(city);
    }

    if (location) {
      filter.location = containsRegex(location);
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice && !isNaN(Number(minPrice))) filter.price.$gte = Number(minPrice);
      if (maxPrice && !isNaN(Number(maxPrice)) && Number(maxPrice) !== Infinity && Number(maxPrice) > 0) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    if (bedrooms && !isNaN(Number(bedrooms)) && Number(bedrooms) > 0) {
      filter.bedrooms = { $gte: Number(bedrooms) };
    }

    if (featured === 'true') filter.isFeatured = true;

    if (onlyVerified === 'true') {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { 'legalInfo.reraNumber': { $ne: '' } },
          { 'legalInfo.titleType': { $ne: '' } }
        ]
      });
    }

    if (search && String(search).trim()) {
      const searchRegex = containsRegex(String(search).trim());
      const searchOr = [
        { title: searchRegex },
        { location: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
        { area: searchRegex },
        { address: searchRegex },
        { village: searchRegex },
        { surveyNumber: searchRegex },
        { description: searchRegex },
        { highlights: searchRegex },
        { amenities: searchRegex }
      ];

      filter.$and.push({ $or: searchOr });
    }

    let sortOptions = { isFeatured: -1, createdAt: -1 };
    if (sort === 'PRICE_LOW') sortOptions = { price: 1, createdAt: -1 };
    else if (sort === 'PRICE_HIGH') sortOptions = { price: -1, createdAt: -1 };
    else if (sort === 'NEWEST') sortOptions = { createdAt: -1 };

    const properties = await Property.find(filter)
      .populate('projectId', 'name code location city bannerImage')
      .sort(sortOptions);

    res.json(await Promise.all(properties.map(async (property) => toPublicProperty(await withFreshGallery(property)))));
  } catch (error) {
    next(error);
  }
};

exports.getPublicPropertyBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const slugFilter = isValidObjectId(slug)
      ? { $or: [{ _id: slug }, { slug }] }
      : { slug };

    const property = await Property.findOne({
      $and: [slugFilter, APPROVAL_FILTER],
      isPublished: { $ne: false }
    })
      .populate('projectId', 'name code location city bannerImage mapImageUrl');

    if (!property) return res.status(404).json({ message: 'Property not found' });

    const similarOr = [
      { propertyType: property.propertyType },
      { city: property.city }
    ];
    // Only match on project when there is one (null would match every standalone listing).
    if (property.projectId) similarOr.push({ projectId: property.projectId._id || property.projectId });

    const similar = await Property.find({
      _id: { $ne: property._id },
      isPublished: { $ne: false },
      $and: [APPROVAL_FILTER, { $or: similarOr }]
    })
      .limit(4)
      .sort({ isFeatured: -1, createdAt: -1 });

    res.json({
      property: toPublicProperty(await withFreshGallery(property)),
      similar: await Promise.all(similar.map(async (item) => toPublicProperty(await withFreshGallery(item))))
    });
  } catch (error) {
    next(error);
  }
};

exports.getPublicGallery = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    const items = [];

    const projects = await Project.find({ status: { $ne: 'DELETED' } })
      .select('name bannerImage mapImageUrl gallery')
      .lean();

    projects.forEach((project) => {
      if (project.bannerImage) {
        items.push({
          url: project.bannerImage,
          caption: project.name,
          sourceType: 'PROJECT',
          sourceId: project._id,
          sourceName: project.name
        });
      }
      if (project.mapImageUrl && project.mapImageUrl !== project.bannerImage) {
        items.push({
          url: project.mapImageUrl,
          caption: `${project.name} Layout`,
          sourceType: 'PROJECT',
          sourceId: project._id,
          sourceName: project.name
        });
      }
      (project.gallery || []).forEach((img) => {
        if (img.url) {
          items.push({
            url: img.url,
            caption: img.caption || project.name,
            sourceType: 'PROJECT',
            sourceId: project._id,
            sourceName: project.name
          });
        }
      });
    });

    const properties = await Property.find({
      isPublished: { $ne: false },
      ...APPROVAL_FILTER
    })
      .select('title heroImage gallery')
      .lean();

    properties.forEach((property) => {
      if (property.heroImage) {
        items.push({
          url: property.heroImage,
          caption: property.title,
          sourceType: 'PROPERTY',
          sourceId: property._id,
          sourceName: property.title
        });
      }
      (property.gallery || []).forEach((img) => {
        if (img.url) {
          items.push({
            url: img.url,
            caption: img.caption || property.title,
            sourceType: 'PROPERTY',
            sourceId: property._id,
            sourceName: property.title
          });
        }
      });
    });

    res.json(items);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUBLIC PROPERTY SUBMISSION (requires JWT — owner identity from token)
// ---------------------------------------------------------------------------

exports.registerPublicProperty = async (req, res, next) => {
  try {
    const body = req.body;

    // Explicit whitelist — never accept privileged fields from body
    const title = String(body.title || '').trim();
    if (!title) return res.status(400).json({ message: 'Property title is required' });

    const slug = await uniqueSlug(title);

    const allowedTypes = PROPERTY_TYPES;
    const allowedListingTypes = LISTING_TYPES;
    const allowedStatuses = PROPERTY_STATUSES;

    // Parse & Validate mandatory KYC Verification Info
    const rawKyc = body.kycInfo || {};
    const kycInfo = {
      fullName: String(rawKyc.fullName || '').trim().substring(0, 100),
      idType: ['PAN', 'AADHAAR', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE'].includes(rawKyc.idType) ? rawKyc.idType : 'PAN',
      idNumber: String(rawKyc.idNumber || '').trim().toUpperCase().substring(0, 50),
      idDocumentUrl: String(rawKyc.idDocumentUrl || '').trim(),
      idDocumentS3Key: String(rawKyc.idDocumentS3Key || '').trim(),
      ownershipType: ['OWNER', 'JOINT_OWNER', 'AGENT_POA', 'BUILDER'].includes(rawKyc.ownershipType) ? rawKyc.ownershipType : 'OWNER',
      ownershipDocumentUrl: String(rawKyc.ownershipDocumentUrl || '').trim(),
      ownershipDocumentS3Key: String(rawKyc.ownershipDocumentS3Key || '').trim(),
      propertyTaxId: String(rawKyc.propertyTaxId || '').trim().substring(0, 50),
      declarationSigned: Boolean(rawKyc.declarationSigned),
      verifiedStatus: 'PENDING',
      submittedAt: new Date()
    };

    if (!kycInfo.fullName || !kycInfo.idNumber || !kycInfo.declarationSigned) {
      return res.status(400).json({
        message: 'KYC Verification incomplete: Full legal name, valid Government ID number, and declaration agreement are required.'
      });
    }

    const payload = {
      title,
      slug,
      tagline: String(body.tagline || '').substring(0, 200),
      description: String(body.description || '').substring(0, 2000),
      propertyType: allowedTypes.includes(body.propertyType) ? body.propertyType : 'RESIDENTIAL_PLOT',
      listingType: allowedListingTypes.includes(body.listingType) ? body.listingType : 'SALE',
      location: String(body.location || '').substring(0, 200),
      city: String(body.city || '').substring(0, 100),
      state: String(body.state || '').substring(0, 100),
      area: String(body.area || '').substring(0, 100),
      address: String(body.address || '').substring(0, 500),
      pincode: String(body.pincode || '').substring(0, 10),
      ...(() => {
        const { applyPropertyMaps } = require('../utils/googleMaps');
        const maps = applyPropertyMaps(body);
        return {
          latitude: maps.latitude !== undefined
            ? maps.latitude
            : (Number.isFinite(Number(body.latitude)) ? Number(body.latitude) : null),
          longitude: maps.longitude !== undefined
            ? maps.longitude
            : (Number.isFinite(Number(body.longitude)) ? Number(body.longitude) : null),
          googleMapsUrl: String(maps.googleMapsUrl || body.googleMapsUrl || '').substring(0, 500),
          mapEmbedUrl: String(maps.mapEmbedUrl || body.mapEmbedUrl || '').substring(0, 500)
        };
      })(),
      price: Number(body.price) || 0,
      pricePerSqft: Number(body.pricePerSqft) || 0,
      priceRange: String(body.priceRange || '').substring(0, 80),
      areaSqft: Number(body.areaSqft) || 0,
      areaSqYrd: Number(body.areaSqYrd) || 0,
      dimensions: String(body.dimensions || '').substring(0, 100),
      bedrooms: Math.max(0, Number(body.bedrooms) || 0),
      bathrooms: Math.max(0, Number(body.bathrooms) || 0),
      parkingSpaces: Math.max(0, Number(body.parkingSpaces) || 0),
      amenities: Array.isArray(body.amenities) ? body.amenities.filter(Boolean).slice(0, 20) : [],
      features: Array.isArray(body.features) ? body.features.filter(Boolean).slice(0, 20) : [],
      highlights: Array.isArray(body.highlights) ? body.highlights.filter(Boolean).slice(0, 20) : [],
      heroImage: String(body.heroImage || ''),
      gallery: sanitizeGallery(body.gallery).slice(0, 10),
      contactPhone: String(body.contactPhone || '').substring(0, 20),
      contactEmail: String(body.contactEmail || '').substring(0, 100),
      kycInfo,
      // Forced fields — never accepted from body
      status: 'AVAILABLE',
      approvalStatus: 'PENDING',
      source: 'PUBLIC',
      isPublished: true,
      isFeatured: false,
      submittedAt: new Date(),
      createdBy: req.user._id
    };

    const property = await Property.create(payload);

    // Fire-and-forget admin notification
    notifyAdmins({
      title: `New Property Submission — ${title}`,
      message: `${kycInfo.fullName} · ${[body.city, body.state].filter(Boolean).join(', ') || 'Location TBD'} · ${payload.propertyType.replace('_', ' ')} · Pending review`,
      category: 'PROPERTY',
      meta: { propertyId: property._id, title, submitterName: kycInfo.fullName, city: body.city, propertyType: payload.propertyType }
    });

    // Generate human-friendly reference ID from Mongo ObjectId
    const referenceId = `HS-PROP-${String(property._id).slice(-6).toUpperCase()}`;

    res.status(201).json({
      success: true,
      message: 'Property submitted successfully! Our team will review it shortly.',
      data: { referenceId, status: 'PENDING', propertyId: property._id }
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// OWNER: MY PROPERTIES  (returns only the requester's own properties)
// ---------------------------------------------------------------------------

exports.getMyProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({
      createdBy: req.user._id,
      source: 'PUBLIC'
    })
      .select('title slug heroImage gallery propertyType listingType location city state area price priceRange approvalStatus status submittedAt rejectionReason createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: properties });
  } catch (error) {
    next(error);
  }
};

exports.getMyPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid property id' });

    const property = await Property.findById(id)
      .select('-createdBy -isFeatured -legalInfo')
      .lean();

    if (!property) return res.status(404).json({ message: 'Property not found' });

    if (String(property.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied. This property does not belong to your account.' });
    }

    res.json({ success: true, data: property });
  } catch (error) {
    next(error);
  }
};

// Owner: Edit & resubmit a rejected property
exports.updateMyProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid property id' });

    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (String(property.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    if (property.approvalStatus === 'APPROVED') {
      return res.status(400).json({ message: 'Approved properties cannot be modified through this endpoint.' });
    }

    const body = req.body;
    // Only update allowed fields — approval fields are always reset, not accepted from body
    const updates = {
      title: String(body.title || property.title).trim().substring(0, 160),
      tagline: String(body.tagline || property.tagline || '').substring(0, 200),
      description: String(body.description || property.description || '').substring(0, 2000),
      propertyType: PROPERTY_TYPES.includes(body.propertyType) ? body.propertyType : property.propertyType,
      listingType: LISTING_TYPES.includes(body.listingType) ? body.listingType : property.listingType,
      location: String(body.location || property.location || '').substring(0, 200),
      city: String(body.city || property.city || '').substring(0, 100),
      state: String(body.state || property.state || '').substring(0, 100),
      area: String(body.area || property.area || '').substring(0, 100),
      address: String(body.address || property.address || '').substring(0, 500),
      price: Number(body.price) || property.price || 0,
      areaSqft: Number(body.areaSqft) || property.areaSqft || 0,
      bedrooms: Math.max(0, Number(body.bedrooms) || property.bedrooms || 0),
      bathrooms: Math.max(0, Number(body.bathrooms) || property.bathrooms || 0),
      parkingSpaces: Math.max(0, Number(body.parkingSpaces) || property.parkingSpaces || 0),
      amenities: Array.isArray(body.amenities) ? body.amenities.filter(Boolean).slice(0, 20) : property.amenities,
      heroImage: body.heroImage !== undefined ? String(body.heroImage) : property.heroImage,
      gallery: body.gallery !== undefined ? sanitizeGallery(body.gallery).slice(0, 10) : property.gallery,
      contactPhone: String(body.contactPhone || property.contactPhone || '').substring(0, 20),
      contactEmail: String(body.contactEmail || property.contactEmail || '').substring(0, 100),
      kycInfo: body.kycInfo ? {
        fullName: String(body.kycInfo.fullName || property.kycInfo?.fullName || '').trim().substring(0, 100),
        idType: ['PAN', 'AADHAAR', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE'].includes(body.kycInfo.idType) ? body.kycInfo.idType : (property.kycInfo?.idType || 'PAN'),
        idNumber: String(body.kycInfo.idNumber || property.kycInfo?.idNumber || '').trim().toUpperCase().substring(0, 50),
        idDocumentUrl: String(body.kycInfo.idDocumentUrl || property.kycInfo?.idDocumentUrl || '').trim(),
        idDocumentS3Key: String(body.kycInfo.idDocumentS3Key || property.kycInfo?.idDocumentS3Key || '').trim(),
        ownershipType: ['OWNER', 'JOINT_OWNER', 'AGENT_POA', 'BUILDER'].includes(body.kycInfo.ownershipType) ? body.kycInfo.ownershipType : (property.kycInfo?.ownershipType || 'OWNER'),
        ownershipDocumentUrl: String(body.kycInfo.ownershipDocumentUrl || property.kycInfo?.ownershipDocumentUrl || '').trim(),
        ownershipDocumentS3Key: String(body.kycInfo.ownershipDocumentS3Key || property.kycInfo?.ownershipDocumentS3Key || '').trim(),
        propertyTaxId: String(body.kycInfo.propertyTaxId || property.kycInfo?.propertyTaxId || '').trim().substring(0, 50),
        declarationSigned: body.kycInfo.declarationSigned !== undefined ? Boolean(body.kycInfo.declarationSigned) : Boolean(property.kycInfo?.declarationSigned),
        verifiedStatus: 'PENDING',
        submittedAt: new Date()
      } : property.kycInfo,
      // Reset to pending on resubmit
      approvalStatus: 'PENDING',
      rejectionReason: '',
      submittedAt: new Date()
    };

    const updated = await Property.findByIdAndUpdate(id, updates, { new: true })
      .select('title approvalStatus status submittedAt');

    res.json({ success: true, message: 'Property resubmitted for review.', data: updated });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// ADMIN: APPROVE / REJECT
// ---------------------------------------------------------------------------

exports.approveProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid property id' });

    const property = await Property.findByIdAndUpdate(
      id,
      { approvalStatus: 'APPROVED', rejectionReason: '' },
      { new: true }
    );
    if (!property) return res.status(404).json({ message: 'Property not found' });

    res.json({ success: true, message: 'Property approved and now live on the public site.', data: { approvalStatus: property.approvalStatus } });
  } catch (error) {
    next(error);
  }
};

exports.rejectProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid property id' });

    const reason = String(req.body.reason || '').substring(0, 500);

    const property = await Property.findByIdAndUpdate(
      id,
      { approvalStatus: 'REJECTED', rejectionReason: reason },
      { new: true }
    );
    if (!property) return res.status(404).json({ message: 'Property not found' });

    res.json({ success: true, message: 'Property rejected.', data: { approvalStatus: property.approvalStatus, rejectionReason: property.rejectionReason } });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUBLIC: BUYER INQUIRY FOR A SPECIFIC PROPERTY
// ---------------------------------------------------------------------------

exports.createBuyInquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid property id' });

    const property = await Property.findById(id).select('title city state propertyType listingType status approvalStatus isPublished');
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (property.isPublished === false || (property.approvalStatus && property.approvalStatus !== 'APPROVED')) {
      return res.status(404).json({ message: 'Property not found' });
    }
    if (property.status === 'SOLD') return res.status(400).json({ message: 'This property has already been sold.' });

    const { name, phone, email, message: userMessage, budget, inquiryIntent } = req.body;

    if (!name || String(name).trim().length < 2) return res.status(400).json({ message: 'Full name is required' });
    if (!phone || String(phone).trim().length < 5) return res.status(400).json({ message: 'Phone number is required' });

    // Determine inquiry type from client intent or fall back to listing type
    const VALID_INTENTS = ['BUY', 'RENT', 'LEASE'];
    const resolvedIntent = VALID_INTENTS.includes(inquiryIntent) ? inquiryIntent :
      (property.listingType === 'RENT' ? 'RENT' : property.listingType === 'LEASE' ? 'LEASE' : 'BUY');

    const INTENT_MAP = {
      BUY:   { inquiryType: 'PROPERTY_BUY',   icon: '🏠', verb: 'Buy',   successMsg: 'Your buy inquiry has been submitted! Our team will contact you shortly.' },
      RENT:  { inquiryType: 'PROPERTY_RENT',  icon: '🔑', verb: 'Rent',  successMsg: 'Your rent inquiry has been submitted! Our team will reach out shortly.' },
      LEASE: { inquiryType: 'PROPERTY_LEASE', icon: '📋', verb: 'Lease', successMsg: 'Your lease inquiry has been submitted! Our team will contact you within 24 hours.' },
    };
    const intentCfg = INTENT_MAP[resolvedIntent];

    const Inquiry = require('../models/Inquiry');

    const inquiry = await Inquiry.create({
      name: String(name).trim().substring(0, 80),
      email: String(email || '').trim().toLowerCase().substring(0, 100) || `${String(phone).trim()}@property.inquiry`,
      phone: String(phone).trim().substring(0, 20),
      inquiryType: intentCfg.inquiryType,
      message: [
        `[${intentCfg.verb} Inquiry] Property: ${property.title}`,
        `City: ${[property.city, property.state].filter(Boolean).join(', ') || 'N/A'}`,
        `Type: ${property.propertyType.replace(/_/g, ' ')} · Listing: ${property.listingType || 'SALE'}`,
        budget ? `Budget/Range: ${budget}` : '',
        userMessage ? `Notes: ${String(userMessage).trim().substring(0, 600)}` : ''
      ].filter(Boolean).join('\n'),
      status: 'NEW',
      source: 'PROPERTY_PAGE'
    });

    notifyAdmins({
      title: `${intentCfg.icon} ${intentCfg.verb} Inquiry — ${property.title}`,
      message: `${String(name).trim()} · ${String(phone).trim()}${budget ? ` · ${budget}` : ''} · ${property.city || 'N/A'}`,
      category: 'INQUIRY',
      meta: {
        inquiryId: inquiry._id,
        propertyId: id,
        propertyTitle: property.title,
        inquiryIntent: resolvedIntent,
        name: String(name).trim(),
        phone: String(phone).trim(),
        email: String(email || '').trim(),
        budget
      }
    });

    res.status(201).json({
      success: true,
      message: intentCfg.successMsg,
      inquiryId: inquiry._id
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// ADMIN: QUICK STATUS UPDATE (AVAILABLE / BOOKED / SOLD / UPCOMING)
// ---------------------------------------------------------------------------

exports.updatePropertyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid property id' });

    const { status } = req.body;
    const PROPERTY_STATUSES = ['AVAILABLE', 'BOOKED', 'SOLD', 'UPCOMING'];
    if (!PROPERTY_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${PROPERTY_STATUSES.join(', ')}` });
    }

    const property = await Property.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('title status');

    if (!property) return res.status(404).json({ message: 'Property not found' });

    res.json({ success: true, message: `Property marked as ${status}`, data: { status: property.status } });
  } catch (error) {
    next(error);
  }
};

exports.getPublicPropertyLocations = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    
    const properties = await Property.find({
      isPublished: { $ne: false },
      ...APPROVAL_FILTER
    }).select('city location area state village').lean();

    const projects = await Project.find({ status: { $ne: 'DELETED' } })
      .select('city location state village name bannerImage')
      .lean();

    const citySet = new Set();
    const areaSet = new Set();
    const locationSet = new Set();

    properties.forEach(p => {
      if (p.city && p.city.trim()) citySet.add(p.city.trim());
      if (p.area && p.area.trim()) areaSet.add(p.area.trim());
      if (p.location && p.location.trim()) locationSet.add(p.location.trim());
      if (p.village && p.village.trim()) locationSet.add(p.village.trim());
    });

    projects.forEach(p => {
      if (p.city && p.city.trim()) citySet.add(p.city.trim());
      if (p.location && p.location.trim()) locationSet.add(p.location.trim());
      if (p.village && p.village.trim()) locationSet.add(p.village.trim());
    });

    const cities = Array.from(citySet).sort();
    const areas = Array.from(areaSet).sort();
    const locations = Array.from(locationSet).sort();

    res.json({
      cities,
      areas,
      locations
    });
  } catch (error) {
    next(error);
  }
};
