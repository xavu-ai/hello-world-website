const express = require('express');
const router = express.Router();

const VERSION = '1.0.0';

/**
 * Health check endpoint
 * GET /health
 * Response: { status: "ok", timestamp: "ISO8601", version: "1.0.0", correlationId: "uuid" }
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: VERSION,
    correlationId: req.correlationId
  });
});

module.exports = router;
