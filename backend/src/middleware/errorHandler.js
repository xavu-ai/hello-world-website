const { config } = require('../config');

// Re-export PathTraversalError from pathTraversal module
const { PathTraversalError } = require('./pathTraversal');

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.code = 'NOT_FOUND';
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'VALIDATION_ERROR';
  }
}

class InternalError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InternalError';
    this.statusCode = 500;
    this.code = 'INTERNAL_ERROR';
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
 * Returns errors in format:
 * { error: "message", code: "ERROR_CODE", correlationId: "uuid", timestamp: "ISO8601" }
 */
function errorHandler(err, req, res, _next) {
  const correlationId = req.correlationId || 'unknown';
  const timestamp = new Date().toISOString();

  // Log error with correlation ID
  console.error(`[${correlationId}] ${err.name || 'Error'}: ${err.message}`);

  // Determine status code and error code
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  const errorMessage = err.message || 'An unexpected error occurred';

  // Build error response per plan spec: {"error":{"code":"ERROR_CODE","message":"...","correlationId":"uuid"}}
  const errorResponse = {
    error: {
      code: errorCode,
      message: errorMessage,
      correlationId
    }
  };

  res.status(statusCode).json(errorResponse);
}

module.exports = {
  errorHandler,
  correlationIdMiddleware,
  NotFoundError,
  ValidationError,
  InternalError,
  PathTraversalError
};
