const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs').promises;

const { config, validateConfig } = require('./config');
const { pathTraversalMiddleware, PathTraversalError } = require('./middleware/security');
const { errorHandler, correlationIdMiddleware, NotFoundError } = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');

// Validate configuration
validateConfig();

const app = express();

// Security headers
app.use(helmet());

// Correlation ID for request tracking
app.use(correlationIdMiddleware);

// HTTP logging
app.use(morgan(config.logLevel, {
  skip: (req) => req.url === '/health'
}));

// Compression
app.use(compression());

// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.use(healthRouter);

// Static file serving with path traversal protection
// Path traversal middleware must be registered BEFORE express.static
// for routes with :staticPath parameter
app.get('/:staticPath', pathTraversalMiddleware, async (req, res, next) => {
  try {
    const requestedFile = req.params.staticPath;
    const filePath = path.join(config.staticDir, requestedFile);
    
    // Verify the resolved path is within static directory
    const resolvedPath = path.resolve(filePath);
    const staticDirResolved = path.resolve(config.staticDir);
    
    if (!resolvedPath.startsWith(staticDirResolved)) {
      throw new PathTraversalError('Invalid path: outside allowed directory');
    }
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundError(`File not found: ${requestedFile}`);
    }
    
    // Serve the file
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

// Path traversal protection for all routes (catches paths that don't match /:staticPath)
app.get('*', (req, res, next) => {
  const urlPath = req.path;
  
  // Skip check for root path
  if (urlPath === '/') {
    return next();
  }
  
  // Check for null bytes
  if (urlPath.includes('\0') || urlPath.includes('\x00')) {
    return next(new PathTraversalError('Invalid path: null bytes not allowed'));
  }
  
  // Check for absolute paths (but allow /)
  if (path.isAbsolute(urlPath) && urlPath !== '/') {
    return next(new PathTraversalError('Invalid path: absolute paths not allowed'));
  }
  
  // Check for traversal attempts (including encoded)
  const normalized = path.normalize(urlPath);
  const decoded = decodeURIComponent(urlPath);
  const decodedNormalized = path.normalize(decoded);
  
  if (normalized.includes('..') || decodedNormalized.includes('..')) {
    return next(new PathTraversalError('Invalid path: traversal detected'));
  }
  
  next();
});

// Root path - serve index.html (SPA fallback)
app.get('/', async (req, res, next) => {
  try {
    const indexPath = path.join(config.staticDir, 'index.html');
    
    try {
      await fs.access(indexPath);
    } catch {
      throw new NotFoundError('index.html not found');
    }
    
    res.sendFile(indexPath);
  } catch (err) {
    next(err);
  }
});

// SPA fallback - serve index.html for client-side routing
app.get('*', async (req, res, next) => {
  try {
    const indexPath = path.join(config.staticDir, 'index.html');
    
    // Check if index.html exists using async fs
    await fs.access(indexPath);
    
    res.sendFile(indexPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      next(new NotFoundError('index.html not found'));
    } else {
      next(err);
    }
  }
});

// Centralized error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.env}`);
  console.log(`Static directory: ${config.staticDir}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
