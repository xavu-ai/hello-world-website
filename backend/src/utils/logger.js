const morgan = require('morgan');
const config = require('../config');

const logger = morgan((tokens, req, res) => {
  const correlationId = req.correlationId || '-';
  return JSON.stringify({
    time: tokens.date(req, res, 'iso'),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    contentLength: tokens.res(req, res, 'content-length'),
    responseTime: tokens['response-time'](req, res),
    correlationId
  });
});

module.exports = logger;
