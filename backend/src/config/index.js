const path = require('path');
const fs = require('fs').promises;

const env = process.env.NODE_ENV || 'development';

// Load environment variables
try {
  require('dotenv-flow').config({
    path: path.resolve(__dirname, '../..'),
    defaultEnv: env
  });
} catch (err) {
  // dotenv-flow not critical, env vars may come from container
}

// Configuration with validation
const config = {
  env,
  port: parseInt(process.env.PORT || '3000', 10),
  staticDir: process.env.STATIC_DIR || path.resolve(__dirname, '../../public'),
  logLevel: process.env.LOG_LEVEL || 'combined',
  correlationIdHeader: 'X-Request-ID'
};

// Validate required configuration
async function validateConfig() {
  // Skip port validation in test environment (uses random ports)
  if (env !== 'test') {
    const required = [];
    
    if (!Number.isFinite(config.port) || config.port < 1 || config.port > 65535) {
      required.push('PORT must be a valid port number (1-65535)');
    }
    
    if (required.length > 0) {
      throw new Error(`Configuration errors:\n${required.join('\n')}`);
    }
  }
  
  // Verify static directory exists (warning only in test)
  try {
    await fs.access(config.staticDir);
  } catch {
    console.warn(`Warning: Static directory does not exist: ${config.staticDir}`);
  }
  
  return config;
}

module.exports = { config, validateConfig };
