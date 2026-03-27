const { config, validateConfig } = require('../../src/config');
const path = require('path');

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  promises: {
    access: jest.fn()
  }
}));

describe('Config', () => {
  beforeEach(() => {
    jest.resetModules();
    // Clear environment variables
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.STATIC_DIR;
    delete process.env.CORS_ORIGINS;
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_MAX;
  });

  describe('config object', () => {
    test('has default values', () => {
      // Re-require to get fresh config with defaults
      jest.resetModules();
      process.env.NODE_ENV = 'test';
      const { config } = require('../../src/config');
      
      expect(config.port).toBe(3000);
      expect(config.env).toBe('test');
      expect(config.logLevel).toBe('combined');
      expect(config.correlationIdHeader).toBe('X-Request-ID');
    });

    test('uses PORT from environment', () => {
      jest.resetModules();
      process.env.NODE_ENV = 'development';
      process.env.PORT = '8080';
      const { config } = require('../../src/config');
      
      expect(config.port).toBe(8080);
    });

    test('uses CORS_ORIGINS from environment', () => {
      jest.resetModules();
      process.env.NODE_ENV = 'development';
      process.env.CORS_ORIGINS = 'http://localhost:3000,https://example.com';
      const { config } = require('../../src/config');
      
      expect(config.corsOrigins).toEqual(['http://localhost:3000', 'https://example.com']);
    });

    test('has default CORS_ORIGINS when not set', () => {
      jest.resetModules();
      process.env.NODE_ENV = 'development';
      delete process.env.CORS_ORIGINS;
      const { config } = require('../../src/config');
      
      expect(config.corsOrigins).toEqual('*');
    });

    test('parses rate limit settings from env', () => {
      jest.resetModules();
      process.env.NODE_ENV = 'development';
      process.env.RATE_LIMIT_WINDOW_MS = '60000';
      process.env.RATE_LIMIT_MAX = '50';
      const { config } = require('../../src/config');
      
      expect(config.rateLimitWindowMs).toBe(60000);
      expect(config.rateLimitMax).toBe(50);
    });
  });

  describe('validateConfig', () => {
    test('passes validation with default config', async () => {
      jest.resetModules();
      process.env.NODE_ENV = 'test';
      const { validateConfig } = require('../../src/config');
      
      await expect(validateConfig()).resolves.toBeDefined();
    });

    test('fails validation with invalid port', async () => {
      jest.resetModules();
      process.env.NODE_ENV = 'development';
      process.env.PORT = 'invalid';
      const { validateConfig } = require('../../src/config');
      
      await expect(validateConfig()).rejects.toThrow();
    });

    test('fails validation with port out of range', async () => {
      jest.resetModules();
      process.env.NODE_ENV = 'development';
      process.env.PORT = '70000';
      const { validateConfig } = require('../../src/config');
      
      await expect(validateConfig()).rejects.toThrow();
    });
  });
});
