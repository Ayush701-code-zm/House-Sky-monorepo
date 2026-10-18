const { uploadToS3 } = require('../services/s3Service');
const { ALLOWED_MIMES } = require('../middleware/upload');

/**
 * Handle generic file/image upload to AWS S3
 * Returns a pre-signed URL valid for 7 days (works with private buckets)
 * POST /api/v1/upload  (authenticated)
 */
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Defense in depth — multer fileFilter should already enforce this.
    const mime = String(req.file.mimetype || '').toLowerCase();
    if (!ALLOWED_MIMES.has(mime)) {
      return res.status(400).json({ message: 'Only JPEG, PNG, WebP, GIF images and PDF documents are allowed' });
    }

    // The folder becomes the S3 key prefix — restrict it to a safe charset so a
    // caller can't escape into other prefixes (e.g. "../", absolute paths).
    const folder = String(req.body.folder || 'general')
      .replace(/[^a-zA-Z0-9_\-/]/g, '')
      .split('/')
      .filter((seg) => seg && seg !== '.' && seg !== '..')
      .join('/') || 'general';

    // uploadToS3 now returns { url, key } where url is a pre-signed URL
    const result = await uploadToS3(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    // Support both old string return and new { url, key } object
    const url = typeof result === 'string' ? result : result.url;
    const s3Key = typeof result === 'string' ? null : result.key;

    res.json({
      success: true,
      url,
      s3Key,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    next(error);
  }
};
