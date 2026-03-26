const path = require('path');

class PathTraversalError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PathTraversalError';
    this.statusCode = 400;
  }
}

/**
 * Middleware to prevent path traversal attacks
 * Must be registered BEFORE express.static
 */
function pathTraversalMiddleware(req, res, next) {
  const requestedPath = req.params.staticPath;
  
  // Skip if no staticPath parameter (e.g., root path /)
  if (!requestedPath) {
    return next();
  }
  
  // Check for null bytes
  if (requestedPath.includes('\0') || requestedPath.includes('\x00')) {
    return next(new PathTraversalError('Invalid path: null bytes not allowed'));
  }
  
  // Check for absolute paths
  if (path.isAbsolute(requestedPath)) {
    return next(new PathTraversalError('Invalid path: absolute paths not allowed'));
  }
  
  // Normalize and check for traversal attempts
  const normalized = path.normalize(requestedPath);
  if (normalized.includes('..')) {
    return next(new PathTraversalError('Invalid path: traversal detected'));
  }
  
  // Additional check: ensure no decoded traversal
  const decoded = decodeURIComponent(requestedPath);
  if (decoded !== requestedPath && decoded.includes('..')) {
    return next(new PathTraversalError('Invalid path: traversal detected'));
  }
  
  next();
}

module.exports = { pathTraversalMiddleware, PathTraversalError };
