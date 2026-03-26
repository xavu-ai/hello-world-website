const express = require('express');
const router = express.Router();

/**
 * Health check endpoint
 * GET /health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
