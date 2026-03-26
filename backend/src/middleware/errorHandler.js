const logger = require('../utils/logger');

class PathTraversalError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'PathTraversalError';
    this.status = 403;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

class ValidationError extends Error {
  constructor(message = 'Bad Request') {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

class RateLimitError extends Error {
  constructor(message = 'Too Many Requests') {
    super(message);
    this.name = 'RateLimitError';
    this.status = 429;
  }
}

class InternalServerError extends Error {
  constructor(message = 'Internal Server Error') {
    super(message);
    this.name = 'InternalServerError';
    this.status = 500;
  }
}

const errorHandler = (err, req, res, next) => {
  const correlationId = req.correlationId;
  logger.error({ err, correlationId });
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    correlationId
  });
};

module.exports = {
  errorHandler,
  PathTraversalError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  InternalServerError
};
