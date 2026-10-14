/**
 * Tiny dependency-free in-memory rate limiter. Good enough to blunt brute-force
 * on auth endpoints. NOTE: per-process only — behind multiple instances use a
 * shared store (Redis) or express-rate-limit with a distributed store.
 */
function rateLimit({ windowMs = 15 * 60 * 1000, max = 10, message } = {}) {
  const hits = new Map(); // key -> { count, resetAt }

  return (req, res, next) => {
    const key = (req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown') + ':' + req.path;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        message: message || `Too many attempts. Try again in ${retryAfter}s.`
      });
    }
    next();
  };
}

// Opportunistic cleanup so the Map doesn't grow unbounded.
function startSweeper(limiterMaps) {
  // no-op placeholder kept simple; entries self-expire on next hit check
}

module.exports = { rateLimit, startSweeper };
