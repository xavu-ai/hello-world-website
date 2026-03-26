const express = require('express');
const { join } = require('path');
const { promises: fs } = require('fs');
const compression = require('compression');

const config = require('./config');
const logger = require('./utils/logger');
const correlationMiddleware = require('./middleware/correlation');
const { securityHeaders, rateLimitMiddleware, pathTraversalMiddleware } = require('./middleware/security');
const { errorHandler } = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');

const app = express();

app.use(correlationMiddleware);
app.use(logger);
app.use(securityHeaders);
app.use(compression());
app.use(rateLimitMiddleware);
app.use(pathTraversalMiddleware);

app.use('/static', express.static(config.staticPath, {
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

const spaFallbackMiddleware = async (req, res, next) => {
  if (req.method !== 'GET') return next();
  try {
    const indexPath = join(config.staticPath, 'index.html');
    await fs.access(indexPath);
    res.sendFile(indexPath);
  } catch {
    next();
  }
};

app.use(spaFallbackMiddleware);

app.use('/', healthRouter);

app.use(errorHandler);

const server = app.listen(config.port, config.host, () => {
  console.log(`Server running at http://${config.host}:${config.port}`);
});

module.exports = { app, server };
