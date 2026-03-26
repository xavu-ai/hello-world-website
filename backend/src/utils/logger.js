const morgan = require('morgan');
const { config } = require('../config');

/**
 * Morgan logging middleware
 * Logs HTTP requests with correlation ID
 */
const logger = morgan((tokens, req, res) => {
  const correlationId = req.correlationId || '-';
  return [
    `[${correlationId}]`,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens['response-time'](req, res),
    'ms'
  ].join(' ');
});

module.exports = { logger };
