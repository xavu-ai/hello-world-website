const { promises: fs } = require('fs');
const path = require('path');
const { config } = require('../config');

/**
 * SPA Fallback middleware
 * If the requested file doesn't exist, serve index.html for client-side routing
 */
async function spaFallback(req, res, next) {
  try {
    const filePath = path.join(config.staticDir, decodeURIComponent(req.path));
    await fs.access(filePath);
    // File exists, let static middleware handle it
    next();
  } catch {
    // File doesn't exist, serve index.html for SPA routing
    const indexPath = path.resolve(config.staticDir, 'index.html');
    try {
      await fs.access(indexPath);
      res.sendFile(indexPath);
    } catch {
      next(new Error('index.html not found'));
    }
  }
}

module.exports = { spaFallback };
