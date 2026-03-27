const express = require('express');
const router = express.Router();

/**
 * Health check endpoint
 * GET /health
 * Response: { status: "ok", timestamp: "ISO8601", correlationId: "uuid" }
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    correlationId: req.correlationId
  });
});

module.exports = router;
