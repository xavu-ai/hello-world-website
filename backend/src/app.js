const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs').promises;

const { config } = require('./config');
const { pathTraversalGuard } = require('./middleware/pathTraversal');
const { errorHandler, correlationIdMiddleware, NotFoundError } = require('./middleware/errorHandler');
const { helmetMiddleware, corsMiddleware, limiter } = require('./middleware/security');
const healthRouter = require('./routes/health');

/**
 * Express app factory - creates and configures the application
 * @returns {express.Application} Configured Express app
 * 
 * Middleware order (per plan):
 * 1. correlation ID → 2. rate limiter → 3. path traversal → 
 * 4. security headers → 5. compression → 6. static files → 
 * 7. SPA fallback → 8. error handler
 */
function createApp() {
  const app = express();

  // 1. Correlation ID for request tracking
  app.use(correlationIdMiddleware);

  // 2. Rate limiter
  app.use(limiter);

  // 3. Path traversal guard - global middleware for all routes
  app.use(pathTraversalGuard);

  // 4. Security headers (Helmet + CORS)
  app.use(helmetMiddleware);
  app.use(corsMiddleware);

  // 5. Compression
  app.use(compression());

  // 6. Parse URL-encoded bodies (for form submissions)
  app.use(express.urlencoded({ extended: true }));

  // 7. HTTP logging (skip health endpoint)
  app.use(morgan(config.logLevel, {
    skip: (req) => req.url === '/health'
  }));

  // 8. Health check endpoint (before static routes)
  app.use(healthRouter);

  // 9. Root path - serve index.html directly
  app.get('/', (req, res) => {
    const indexPath = path.resolve(config.staticDir, 'index.html');
    res.sendFile(indexPath);
  });

  // 10. Static file serving with ETag support and SPA fallback
  // Serves files from public/ with proper MIME types
  // Falls back to index.html for non-API routes (SPA support)
  app.get('/:path(*)', async (req, res, next) => {
    const requestedPath = req.params.path;
    const filePath = path.join(config.staticDir, requestedPath);

    // Verify the resolved path is within static directory
    const resolvedPath = path.resolve(filePath);
    const staticDirResolved = path.resolve(config.staticDir);

    if (!resolvedPath.startsWith(staticDirResolved + path.sep)) {
      return res.status(403).json({
        error: 'Forbidden',
        code: 'PATH_TRAVERSAL',
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }

    // Check if file exists
    try {
      const stats = await fs.stat(resolvedPath);
      
      // Generate ETag
      const etag = `W/"${stats.size}-${stats.mtime.getTime()}"`;
      res.setHeader('ETag', etag);
      
      // Check If-None-Match for 304
      const ifNoneMatch = req.get('If-None-Match');
      if (ifNoneMatch && ifNoneMatch === etag) {
        return res.status(304).end();
      }
      
      res.sendFile(resolvedPath);
    } catch (err) {
      // File doesn't exist - SPA fallback for non-API routes
      if (req.path.startsWith('/api')) {
        return next(new NotFoundError(`File not found: ${requestedPath}`));
      }
      
      // Serve index.html for SPA fallback
      const indexPath = path.resolve(config.staticDir, 'index.html');
      try {
        await fs.access(indexPath);
        res.setHeader('Content-Type', 'text/html');
        res.sendFile(indexPath);
      } catch {
        next(err);
      }
    }
  });

  // 11. Error handler (last)
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
