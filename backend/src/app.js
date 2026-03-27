const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const { config } = require('./config');
const { pathTraversalGuard } = require('./middleware/pathTraversal');
const { errorHandler, correlationIdMiddleware, NotFoundError } = require('./middleware/errorHandler');
const { helmetMiddleware, corsMiddleware, limiter } = require('./middleware/security');
const healthRouter = require('./routes/health');

/**
 * Express app factory - creates and configures the application
 * @returns {express.Application} Configured Express app
 */
function createApp() {
  const app = express();

  // 1. Security middleware FIRST
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(limiter);

  // 2. Correlation ID for request tracking
  app.use(correlationIdMiddleware);

  // 3. HTTP logging
  app.use(morgan(config.logLevel, {
    skip: (req) => req.url === '/health'
  }));

  // 4. Compression
  app.use(compression());

  // 5. Parse URL-encoded bodies (for form submissions)
  app.use(express.urlencoded({ extended: true }));

  // 6. Path traversal guard - global middleware for all routes
  app.use(pathTraversalGuard);

  // 7. Health check endpoint (before static routes)
  app.use(healthRouter);

  // 8. Static file serving with explicit 404 handling
  // Uses :staticPath route to properly handle missing files with 404
  app.get('/:staticPath', async (req, res, next) => {
    const requestedFile = req.params.staticPath;
    const filePath = path.join(config.staticDir, requestedFile);

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
      await require('fs').promises.access(filePath);
      res.sendFile(filePath);
    } catch {
      // File doesn't exist - trigger 404
      next(new NotFoundError(`File not found: ${requestedFile}`));
    }
  });

  // 9. Root path - serve index.html
  app.get('/', (req, res) => {
    const indexPath = path.resolve(config.staticDir, 'index.html');
    res.sendFile(indexPath);
  });

  // 10. SPA fallback for client-side routing
  // Only for non-API, non-static paths that reached here
  app.use(async (req, res, next) => {
    // Skip API routes and health check
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }

    try {
      const indexPath = path.resolve(config.staticDir, 'index.html');
      await require('fs').promises.access(indexPath);
      res.setHeader('Content-Type', 'text/html');
      res.sendFile(indexPath);
    } catch (err) {
      next(err);
    }
  });

  // 11. Error handler (last)
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
