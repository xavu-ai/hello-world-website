const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { config } = require('../config');

/**
 * Security middleware configuration
 * - Helmet: Security headers
 * - CORS: Cross-origin resource sharing
 * - Rate limiting: Prevent abuse
 */

/**
 * Configure Helmet security headers
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false
});

/**
 * Configure CORS
 */
const corsMiddleware = cors({
  origin: config.corsOrigins,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
});

/**
 * Rate limiting middleware
 * Configurable via RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX env vars
 */
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  limiter
};
