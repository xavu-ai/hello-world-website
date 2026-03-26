const { config } = require('../config');

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class InternalError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InternalError';
    this.statusCode = 500;
  }
}

/**
 * Correlation ID middleware
 * Generates unique IDs for request tracking
 */
function correlationIdMiddleware(req, res, next) {
  const header = config.correlationIdHeader;
  const existingId = req.get(header);
  
  if (existingId) {
    req.correlationId = existingId;
  } else {
    const { v4: uuidv4 } = require('uuid');
    req.correlationId = uuidv4();
  }
  
  res.setHeader(header, req.correlationId);
  next();
}

/**
 * Centralized error handler
 */
function errorHandler(err, req, res, _next) {
  const correlationId = req.correlationId || 'unknown';
  
  // Log error with correlation ID
  console.error(`[${correlationId}] ${err.name}: ${err.message}`);
  
  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Build error response
  const errorResponse = {
    error: {
      name: err.name || 'InternalError',
      message: err.message || 'An unexpected error occurred',
      correlationId
    }
  };
  
  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
}

module.exports = { 
  errorHandler, 
  correlationIdMiddleware,
  NotFoundError,
  InternalError
};
