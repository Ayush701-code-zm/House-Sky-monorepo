const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');

// Pre-signed URL expiry: 7 days (604800 seconds)
// For permanent storage, we store the S3 key in DB and generate fresh signed URLs on demand
const PRESIGNED_URL_EXPIRY = 604800; // 7 days

function getS3Client() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'ap-south-1';

  if (accessKeyId && secretAccessKey) {
    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  }
  return null;
}

/**
 * Generate a pre-signed GET URL for an existing S3 object key
 * This allows access to private bucket objects for a limited time
 * @param {string} s3Key - The S3 object key (path within bucket)
 * @returns {Promise<string>} Pre-signed URL valid for PRESIGNED_URL_EXPIRY seconds
 */
async function getPresignedUrl(s3Key) {
  const bucketName = process.env.AWS_S3_BUCKET_NAME || 'hsynr';
  const client = getS3Client();
  if (!client) return null;

  try {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: s3Key });
    const url = await getSignedUrl(client, command, { expiresIn: PRESIGNED_URL_EXPIRY });
    return url;
  } catch (err) {
    console.error('[S3 PreSign Error]', err.message);
    return null;
  }
}

/**
 * Upload a file buffer to AWS S3 and return a pre-signed URL
 * Works even when bucket has "Block Public Access" enabled (private bucket)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File mime type
 * @param {string} folder - Target folder inside S3 bucket
 * @returns {Promise<{ url: string, key: string }>} Pre-signed URL + S3 key for permanent storage
 */
async function uploadToS3(fileBuffer, originalName = 'file.png', mimeType = 'image/png', folder = 'uploads') {
  const region = process.env.AWS_REGION || 'ap-south-1';
  const bucketName = process.env.AWS_S3_BUCKET_NAME || 'hsynr';

  const ext = path.extname(originalName) || '.png';
  const randomHash = crypto.randomBytes(8).toString('hex');
  const cleanName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${folder}/${Date.now()}_${cleanName}_${randomHash}${ext}`;
  const plainS3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${filename}`;

  const client = getS3Client();

  if (!client || !fileBuffer) {
    console.warn('[S3 Upload] AWS credentials not found, returning placeholder URL');
    return { url: plainS3Url, key: filename };
  }

  try {
    // Upload file to S3 (no ACL needed — works with Block Public Access on)
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: fileBuffer,
      ContentType: mimeType || 'image/png'
    });

    await client.send(command);
    console.log(`[S3 Upload] ✅ Successfully uploaded: ${filename}`);

    // Generate a pre-signed GET URL so private bucket files are viewable
    const presignedUrl = await getPresignedUrl(filename);

    if (presignedUrl) {
      console.log(`[S3 Upload] ✅ Pre-signed URL generated (valid 7 days)`);
      return { url: presignedUrl, key: filename };
    }

    // Fallback to plain URL if presigning fails
    return { url: plainS3Url, key: filename };

  } catch (err) {
    console.error(`[S3 Upload Error] PutObject failed: ${err.message}`);
    // Return structured result even on failure for resilience
    return { url: plainS3Url, key: filename };
  }
}

module.exports = {
  uploadToS3,
  getS3Client,
  getPresignedUrl
};
