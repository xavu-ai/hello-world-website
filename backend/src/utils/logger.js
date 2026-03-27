const morgan = require('morgan');
const path = require('path');

/**
 * Create configured Morgan logger
 * Uses combined format for production, dev for development
 * @param {Object} options
 * @param {string} options.format - Morgan format string
 * @param {Object} options.options - Morgan stream options
 * @returns {Function} Morgan middleware
 */
function createLogger(options = {}) {
  const { format, options: streamOptions = {} } = options;

  // Custom token for correlation ID
  morgan.token('request-id', (req) => req.correlationId || '-');

  // Determine format based on environment
  const logFormat = format || (process.env.NODE_ENV === 'production' ? 'combined' : 'dev');

  // Use combined format with correlation ID for production
  const finalFormat = logFormat === 'combined'
    ? ':request-id - :remote-addr - :method :url :status :res[content-length] - :response-time ms'
    : logFormat;

  return morgan(finalFormat, {
    ...streamOptions,
    skip: (req) => {
      // Skip health check logging
      return req.path === '/health';
    }
  });
}

module.exports = {
  createLogger
};
