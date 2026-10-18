const multer = require('multer');
const path = require('path');

/** Safe media types for property photos, KYC docs, and admin gallery. */
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf'
]);

const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf']);

/** Reject HTML/SVG and other executable content even if Content-Type is spoofed. */
const BLOCKED_EXTS = new Set([
  '.html', '.htm', '.svg', '.xml', '.js', '.mjs', '.css',
  '.php', '.exe', '.sh', '.bat', '.cmd', '.dll', '.jar'
]);

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();

  if (BLOCKED_EXTS.has(ext)) {
    return cb(new Error(`File type "${ext}" is not allowed`));
  }
  if (!ALLOWED_MIMES.has(mime) || !ALLOWED_EXTS.has(ext)) {
    return cb(new Error('Only JPEG, PNG, WebP, GIF images and PDF documents are allowed'));
  }
  cb(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter
});

module.exports = {
  upload,
  ALLOWED_MIMES,
  ALLOWED_EXTS,
  MAX_FILE_BYTES
};
