const { getPresignedUrl } = require('../services/s3Service');
const { deriveMapEmbedUrl } = require('./googleMaps');

/**
 * Ensures project media URLs (mapImageUrl, bannerImage, gallery items)
 * are populated with valid, fresh pre-signed S3 URLs.
 * @param {Object} project - Plain object or Mongoose document
 * @returns {Promise<Object>} Hydrated project object
 */
async function withFreshProjectMedia(project) {
  if (!project) return project;
  const p = typeof project.toObject === 'function' ? project.toObject() : { ...project };

  if (p.mapImageS3Key) {
    const freshMap = await getPresignedUrl(p.mapImageS3Key);
    if (freshMap) p.mapImageUrl = freshMap;
  }

  if (p.bannerImageS3Key) {
    const freshBanner = await getPresignedUrl(p.bannerImageS3Key);
    if (freshBanner) p.bannerImage = freshBanner;
  }

  if (Array.isArray(p.gallery) && p.gallery.length > 0) {
    p.gallery = await Promise.all(
      p.gallery.map(async (item) => {
        if (!item) return item;
        const g = typeof item.toObject === 'function' ? item.toObject() : { ...item };
        if (g.s3Key) {
          const freshUrl = await getPresignedUrl(g.s3Key);
          if (freshUrl) g.url = freshUrl;
        }
        return g;
      })
    );
  }

  if (!p.mapEmbedUrl && p.googleMapsUrl) {
    p.mapEmbedUrl = deriveMapEmbedUrl(p.googleMapsUrl);
  }

  return p;
}

module.exports = {
  withFreshProjectMedia
};
