const { resolve, normalize, isAbsolute } = require('path');

const PUBLIC_DIR = resolve(process.cwd(), 'public');

class PathTraversalError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PathTraversalError';
    this.statusCode = 400;
    this.code = 'PATH_TRAVERSAL';
  }
}

/**
 * Path traversal guard middleware
 * MUST be registered BEFORE express.static()
 * Checks that requested paths don't escape the public directory
 */
const pathTraversalGuard = (req, res, next) => {
  // Get the decoded URL path
  let requestedPath = decodeURIComponent(req.path);

  // Skip empty path and root
  if (!requestedPath || requestedPath === '/') {
    return next();
  }

  // Check for null bytes
  if (requestedPath.includes('\0') || requestedPath.includes('\x00')) {
    return res.status(403).json({
      error: 'Forbidden',
      code: 'PATH_TRAVERSAL',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }

  // Remove leading slash and resolve to get actual file location
  const relativePath = requestedPath.replace(/^\//, '');
  const resolvedPath = resolve(PUBLIC_DIR, relativePath);

  // Check if the resolved path is within PUBLIC_DIR
  if (!resolvedPath.startsWith(PUBLIC_DIR + '/')) {
    return res.status(403).json({
      error: 'Forbidden',
      code: 'PATH_TRAVERSAL',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }

  req.safePath = resolvedPath;
  next();
};

module.exports = { pathTraversalGuard, PathTraversalError };
