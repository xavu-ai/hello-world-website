/**
 * Server entry point
 * Starts the Express server with graceful shutdown handling
 */

const { createApp } = require('./app');
const { config, validateConfig } = require('./config');

/**
 * Initialize and start the server
 */
async function start() {
  try {
    // Validate configuration
    await validateConfig();

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
      console.log(`Environment: ${config.env}`);
      console.log(`Static files: ${config.staticDir}`);
    });

    /**
     * Graceful shutdown handler
     * @param {string} signal - Signal name (SIGTERM, SIGINT)
     */
    const gracefulShutdown = (signal) => {
      console.log(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start server if this is the main module
if (require.main === module) {
  start();
}

module.exports = { start };
