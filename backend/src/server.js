const { createApp } = require('./app');
const { config, validateConfig } = require('./config');

(async () => {
  try {
    await validateConfig();
  } catch (err) {
    console.error('Configuration validation failed:', err.message);
    process.exit(1);
  }

  const app = createApp();

  // Start server
  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${config.env}`);
    console.log(`Static directory: ${config.staticDir}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
})();
