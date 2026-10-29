// Load .env FIRST — local modules (e.g. config/jwt) read process.env at
// require-time, so this must run before any of the requires below.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Behind a reverse proxy (Vercel/Nginx) req.ip is the proxy's address unless we
// trust X-Forwarded-For — otherwise every client shares one rate-limit bucket.
app.set('trust proxy', 1);

// Connect MongoDB Database
connectDB();

// CORS — set CORS_ORIGINS (comma-separated) in production to restrict origins.
// Falls back to '*' if unset so local dev / current deploy keep working.
// In development, also accept the 127.0.0.1 twin of each localhost origin
// (browsers treat them as different origins; Cursor/devtools often use 127.0.0.1).
function expandLocalhostTwins(origins) {
  if (origins === '*' || !Array.isArray(origins)) return origins;
  const set = new Set(origins);
  for (const o of origins) {
    if (o.includes('://localhost')) set.add(o.replace('://localhost', '://127.0.0.1'));
    if (o.includes('://127.0.0.1')) set.add(o.replace('://127.0.0.1', '://localhost'));
  }
  return [...set];
}
const corsOrigins = process.env.CORS_ORIGINS
  ? expandLocalhostTwins(process.env.CORS_ORIGINS.split(',').map((o) => o.trim()))
  : '*';
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
// JSON/urlencoded body limit (plot CSV imports, etc.). Multipart file uploads
// are sized separately by multer in middleware/upload.js.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Router
app.use('/api/v1', apiRoutes);

// Root Health Check Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'House & Sky Real Estate Platform API',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Increase timeout for long-running OCR operations (10 minutes)
const server = app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});
server.timeout = 600000; // 10 minutes
// Node >= 18 closes any request still in flight after 300s (requestTimeout);
// OCR naksha analysis can legitimately run longer than that.
server.requestTimeout = 600000;
server.keepAliveTimeout = 610000;
server.headersTimeout = 620000;

module.exports = app;
