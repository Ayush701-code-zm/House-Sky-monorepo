/**
 * Single source for the JWT signing secret. Fails fast at boot if the secret
 * is not configured, so tokens can never be signed/verified with a known
 * hardcoded fallback (which would let anyone forge tokens).
 */
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

if (!JWT_SECRET) {
  // Do not start the app with an insecure default.
  throw new Error(
    'FATAL: JWT_SECRET is not set. Add a strong JWT_SECRET to your environment before starting the server.'
  );
}

module.exports = { JWT_SECRET, JWT_EXPIRE };
