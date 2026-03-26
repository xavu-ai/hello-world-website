const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { resolve } = require('path');
const config = require('../config');

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

const limiterConfig = {
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests' },
};

const rateLimitMiddleware = rateLimit(limiterConfig);

const pathTraversalMiddleware = (req, res, next) => {
  const decodedPath = decodeURIComponent(req.path);
  const requestedPath = decodedPath.replace(/^\//, '');
  const resolvedPath = resolve(config.staticPath, requestedPath);

  if (!resolvedPath.startsWith(config.staticPath)) {
    return res.status(403).json({ error: 'Forbidden', correlationId: req.correlationId });
  }
  next();
};

module.exports = {
  securityHeaders,
  rateLimitMiddleware,
  pathTraversalMiddleware,
  limiterConfig
};
